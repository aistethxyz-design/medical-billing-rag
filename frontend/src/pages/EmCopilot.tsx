import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getApiBase } from '@/services/runtimeConfig';
import { useAuthStore } from '@/stores/authStore';

/**
 * EM Copilot — live decision-support cues from a doctor–patient conversation.
 *
 * Ported from the standalone glasses demo into the wiserdoc SPA. It calls the
 * same-origin authenticated proxy (`/api/snapshot`, `/api/copilot`) with the
 * user's Bearer token; the Cloudflare Worker verifies the allowlist and forwards
 * to the RAG backend. The raw transcript is operator-view only and is never
 * persisted server-side (see backend privacy controls).
 *
 * Trial rule: synthetic / de-identified cases only — no real patient identifiers.
 */

const PAGE_CHARS = 200;
const MIN_TRIGGER_CHARS = 40; // fire full guidance once this much has been said
const MIN_NEW_CHARS_FOR_REFRESH = 35; // refresh guidance after this many new chars
const SNAPSHOT_MIN_CHARS = 25; // fire the fast intake snapshot earlier
const SNAPSHOT_REFRESH_CHARS = 40;

type Status = 'idle' | 'listening' | 'thinking' | 'guidance' | 'error';

const STATUS_STYLES: Record<Status, string> = {
  idle: 'text-gray-400 border-gray-500',
  listening: 'text-green-400 border-green-400 bg-green-400/10',
  thinking: 'text-amber-400 border-amber-400 bg-amber-400/10',
  guidance: 'text-sky-400 border-sky-400 bg-sky-400/10',
  error: 'text-red-400 border-red-400 bg-red-400/10',
};

function paginateByLines(text: string): string[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const pages: string[] = [];
  let current = '';
  for (const line of lines) {
    if (current && current.length + line.length + 1 > PAGE_CHARS) {
      pages.push(current);
      current = line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current) pages.push(current);
  return pages.length ? pages : ['(no guidance)'];
}

function renderGuidanceHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, (m) => `<ul class="list-disc ml-5">${m}</ul>`)
    .replace(/\n/g, '<br>');
}

const EmCopilot: React.FC = () => {
  const { token } = useAuthStore();
  const apiBase = getApiBase();

  const [status, setStatus] = useState<Status>('idle');
  const [statusText, setStatusText] = useState('Ready');
  const [listening, setListening] = useState(false);
  const [finalDisplay, setFinalDisplay] = useState('');
  const [interimDisplay, setInterimDisplay] = useState('');
  const [glasses, setGlasses] = useState('Tap Start listening — guidance appears automatically as context builds.');
  const [pageLabel, setPageLabel] = useState('');
  const [guidanceHtml, setGuidanceHtml] = useState('');
  const [sources, setSources] = useState('');
  const [manualText, setManualText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  // Imperative state that must not trigger re-renders on every keystroke.
  const finalTextRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const guidancePagesRef = useRef<string[]>([]);
  const pageIndexRef = useRef(0);
  const lastQueriedRef = useRef('');
  const inFlightRef = useRef(false);
  const dirtyRef = useRef(false);
  const snapshotTextRef = useRef('');
  const snapshotInFlightRef = useRef(false);
  const lastSnapshotRef = useRef('');

  const setChip = useCallback((kind: Status, text: string) => {
    setStatus(kind);
    setStatusText(text);
  }, []);

  const showGlasses = useCallback((text: string, page: number, total: number) => {
    setGlasses(text.slice(0, PAGE_CHARS + 60));
    setPageLabel(total > 1 ? `${page}/${total}` : '');
  }, []);

  const authHeaders = useCallback(
    () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` }),
    [token],
  );

  // ── Fast intake snapshot (PT/CC/HPI) — best effort, never blocks guidance ──
  const dispatchSnapshot = useCallback(
    async (transcript: string) => {
      snapshotInFlightRef.current = true;
      lastSnapshotRef.current = transcript;
      try {
        const resp = await fetch(`${apiBase}/api/snapshot`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ transcript }),
        });
        if (!resp.ok) return;
        const { snapshot } = await resp.json();
        if (snapshot && !guidancePagesRef.current.length) {
          snapshotTextRef.current = snapshot;
          showGlasses(snapshot, 0, 0);
          setPageLabel('intake');
          if (inFlightRef.current) setChip('thinking', 'Intake summary shown — full guidance loading…');
        }
      } catch {
        /* snapshot is a nicety; the guidance path handles real errors */
      } finally {
        snapshotInFlightRef.current = false;
      }
    },
    [apiBase, authHeaders, setChip, showGlasses],
  );

  const maybeTriggerSnapshot = useCallback(() => {
    if (guidancePagesRef.current.length || snapshotInFlightRef.current) return;
    const t = finalTextRef.current.trim();
    if (t.length < SNAPSHOT_MIN_CHARS) return;
    if (snapshotTextRef.current && t.length - lastSnapshotRef.current.length < SNAPSHOT_REFRESH_CHARS) return;
    void dispatchSnapshot(t);
  }, [dispatchSnapshot]);

  // ── Full RAG guidance ──────────────────────────────────────────────────────
  const dispatchQuery = useCallback(async () => {
    inFlightRef.current = true;
    dirtyRef.current = false;
    const transcript = finalTextRef.current;
    lastQueriedRef.current = transcript;
    const isFirst = guidancePagesRef.current.length === 0;

    try {
      if (isFirst && !snapshotTextRef.current) showGlasses('⏳ Analyzing…', 0, 0);
      setChip('thinking', isFirst ? 'Querying EM Copilot…' : 'Updating guidance…');

      const resp = await fetch(`${apiBase}/api/copilot`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ transcript: transcript.trim(), k: 10 }),
      });
      if (!resp.ok) {
        const msg = resp.status === 403 ? 'Not authorized for the EM Copilot' : `Backend error (${resp.status})`;
        throw new Error(msg);
      }
      const { guidance, sources: srcs, took_ms, insufficient } = await resp.json();

      if (insufficient) {
        setChip('listening', snapshotTextRef.current
          ? 'Showing intake summary — listening for more context…'
          : 'Listening — building context…');
        maybeTriggerSnapshot();
      } else {
        const pages = paginateByLines(guidance);
        guidancePagesRef.current = pages;
        pageIndexRef.current = 0;
        showGlasses(pages[0], 1, pages.length);
        setGuidanceHtml(renderGuidanceHtml(guidance));
        const serverMs = typeof took_ms === 'number' ? took_ms.toFixed(0) : '?';
        setSources((srcs?.length ? `Sources: ${srcs.join(', ')}` : '') + `  ·  ${serverMs}ms`);
        setChip('guidance', pages.length > 1 ? 'Live guidance · updates as you speak' : 'Live guidance');
      }
    } catch (err: any) {
      setChip('error', String(err?.message || err));
      if (!guidancePagesRef.current.length && !snapshotTextRef.current) {
        showGlasses(`⚠ ${String(err?.message || err).slice(0, 160)}`, 0, 0);
      }
    } finally {
      inFlightRef.current = false;
      if (dirtyRef.current) maybeTriggerQuery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, authHeaders, setChip, showGlasses, maybeTriggerSnapshot]);

  const maybeTriggerQuery = useCallback(() => {
    maybeTriggerSnapshot();
    const newChars = finalTextRef.current.length - lastQueriedRef.current.length;
    const haveGuidance = guidancePagesRef.current.length > 0;
    const readyForFirst = !haveGuidance && finalTextRef.current.trim().length >= MIN_TRIGGER_CHARS;
    const readyForRefresh = haveGuidance && newChars >= MIN_NEW_CHARS_FOR_REFRESH;
    if (inFlightRef.current) {
      if (newChars >= MIN_NEW_CHARS_FOR_REFRESH) dirtyRef.current = true;
      return;
    }
    if (readyForFirst || readyForRefresh) void dispatchQuery();
  }, [dispatchQuery, maybeTriggerSnapshot]);

  // ── Web Speech API setup ────────────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-US';

    recognition.onresult = (ev: any) => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) {
          finalTextRef.current += (finalTextRef.current ? ' ' : '') + t.trim();
        } else {
          interim += t;
        }
      }
      setFinalDisplay(finalTextRef.current);
      setInterimDisplay(interim ? ` ${interim}` : '');
      maybeTriggerQuery();
    };
    recognition.onerror = (ev: any) => {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        listeningRef.current = false;
        setListening(false);
        setChip('error', 'Mic blocked — allow microphone access for this site and try again');
      }
    };
    recognition.onend = () => {
      if (listeningRef.current) setTimeout(() => { try { recognition.start(); } catch { /* already started */ } }, 200);
    };
    recognitionRef.current = recognition;

    return () => {
      listeningRef.current = false;
      try { recognition.stop(); } catch { /* noop */ }
    };
  }, [maybeTriggerQuery, setChip]);

  const toggleListen = useCallback(async () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (!listeningRef.current) {
      try {
        micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setChip('error', 'Mic blocked — allow microphone access (check the address-bar icon)');
        return;
      }
      listeningRef.current = true;
      setListening(true);
      try { recognition.start(); } catch { /* already started */ }
      setChip('listening', 'Listening — building context…');
      if (!guidancePagesRef.current.length) showGlasses('Listening for context…', 0, 0);
    } else {
      listeningRef.current = false;
      setListening(false);
      try { recognition.stop(); } catch { /* noop */ }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      setChip('idle', 'Stopped');
    }
  }, [setChip, showGlasses]);

  const nextPage = useCallback(() => {
    const pages = guidancePagesRef.current;
    if (pages.length <= 1) return;
    pageIndexRef.current = (pageIndexRef.current + 1) % pages.length;
    showGlasses(pages[pageIndexRef.current], pageIndexRef.current + 1, pages.length);
  }, [showGlasses]);

  const submitManual = useCallback(() => {
    const t = manualText.trim();
    if (t.length < 8) { setChip('error', 'Enter at least a few words'); return; }
    finalTextRef.current = t;
    setFinalDisplay(t);
    setInterimDisplay('');
    lastQueriedRef.current = '';
    guidancePagesRef.current = [];
    snapshotTextRef.current = '';
    lastSnapshotRef.current = '';
    maybeTriggerSnapshot();
    void dispatchQuery();
  }, [manualText, dispatchQuery, maybeTriggerSnapshot, setChip]);

  const clearAll = useCallback(() => {
    finalTextRef.current = '';
    setFinalDisplay('');
    setInterimDisplay('');
    setManualText('');
    guidancePagesRef.current = [];
    pageIndexRef.current = 0;
    lastQueriedRef.current = '';
    dirtyRef.current = false;
    snapshotTextRef.current = '';
    lastSnapshotRef.current = '';
    setGuidanceHtml('');
    setSources('');
    setPageLabel('');
    showGlasses('Tap Start listening — guidance appears automatically as context builds.', 0, 0);
    setChip('idle', 'Ready');
  }, [showGlasses, setChip]);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">EM Copilot</h1>
          <p className="text-sm text-gray-500">Decision-support prototype — speak or type a patient presentation</p>
        </div>
        <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border ${STATUS_STYLES[status]}`}>
          {statusText}
        </span>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-2">
        <strong>Trial use — synthetic / de-identified cases only.</strong> Do not enter real patient
        names, MRNs, or other identifiers. This is decision support, not a medical device.
      </div>

      {/* Simulated glasses display */}
      <div className="bg-black border-2 border-gray-700 rounded-2xl px-5 py-4 min-h-[96px] shadow-inner">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] tracking-widest uppercase text-gray-500">Glasses display (simulated)</span>
          <span className="text-[10px] tracking-widest uppercase text-gray-500">{pageLabel}</span>
        </div>
        <pre className="text-green-400 font-mono text-sm leading-snug whitespace-pre-wrap break-words">{glasses}</pre>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={toggleListen}
            disabled={!speechSupported}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${listening ? 'bg-red-100 text-red-700' : 'bg-green-500 text-green-950'} disabled:opacity-40`}
          >
            {listening ? 'Stop listening' : 'Start listening'}
          </button>
          <button onClick={nextPage} className="px-4 py-2.5 rounded-lg font-semibold text-sm bg-gray-200 text-gray-800">Next page</button>
          <button onClick={clearAll} className="px-4 py-2.5 rounded-lg font-semibold text-sm bg-gray-200 text-gray-800">Clear</button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {speechSupported
            ? 'Uses your browser microphone (Chrome or Edge). Guidance fires automatically as context builds.'
            : 'Speech recognition is not supported in this browser — use the text box below (Chrome or Edge for mic).'}
        </p>
      </div>

      {/* Transcript (operator view) */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">Transcript (operator view only — not shown on glasses)</p>
        <p className="text-base leading-relaxed whitespace-pre-wrap break-words min-h-[3em]">
          <span>{finalDisplay}</span>
          <span className="text-gray-400">{interimDisplay}</span>
        </p>
      </div>

      {/* Manual entry */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">Or type a scenario</p>
        <textarea
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="e.g. 45M crushing chest pain radiating to left arm, diaphoretic, BP 90/60…"
          className="w-full min-h-[72px] rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <div className="mt-2">
          <button onClick={submitManual} className="px-4 py-2 rounded-lg font-semibold text-sm bg-gray-800 text-white">Submit typed text</button>
        </div>
      </div>

      {/* Full guidance card */}
      {guidanceHtml && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">Clinical guidance (consider)</p>
          <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: guidanceHtml }} />
          {sources && <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">{sources}</p>}
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        Decision support only — the physician retains full clinical judgment · Not for real-patient use without validation
      </p>
    </div>
  );
};

export default EmCopilot;
