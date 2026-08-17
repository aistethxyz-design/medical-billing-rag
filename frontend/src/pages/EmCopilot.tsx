import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Stethoscope,
  Mic,
  MicOff,
  ChevronRight,
  RotateCcw,
  Send,
  FileText,
  Keyboard,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';
import { getApiBase } from '@/services/runtimeConfig';
import { useAuthStore } from '@/stores/authStore';
import PageHeader from '@/components/layout/PageHeader';
import copilotGlasses from '@/assets/copilot-glasses.png';

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
  idle: 'bg-gray-50 text-gray-600 border-gray-200',
  listening: 'bg-green-50 text-green-700 border-green-200',
  thinking: 'bg-amber-50 text-amber-700 border-amber-200',
  guidance: 'bg-sky-50 text-sky-700 border-sky-200',
  error: 'bg-red-50 text-red-700 border-red-200',
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
  const [pageCount, setPageCount] = useState(0);

  // Imperative state that must not trigger re-renders on every keystroke.
  const finalTextRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const guidancePagesRef = useRef<string[]>([]);
  const pageIndexRef = useRef(0);
  const lastQueriedRef = useRef('');
  const inFlightRef = useRef(false);
  const dirtyRef = useRef(false);
  const snapshotTextRef = useRef('');
  const snapshotInFlightRef = useRef(false);
  const lastSnapshotRef = useRef('');
  // Ref indirection so dispatchQuery always calls the latest maybeTriggerQuery
  // (they reference each other; a direct call would close over the first render's copy).
  const maybeTriggerQueryRef = useRef<() => void>(() => {});

  const setChip = useCallback((kind: Status, text: string) => {
    setStatus(kind);
    setStatusText(text);
  }, []);

  const showGlasses = useCallback((text: string, page: number, total: number) => {
    setGlasses(text.slice(0, PAGE_CHARS + 60));
    setPageLabel(total > 1 ? `${page}/${total}` : '');
    setPageCount(total);
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
      if (isFirst && !snapshotTextRef.current) showGlasses('Analyzing…', 0, 0);
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
        showGlasses(`ERROR: ${String(err?.message || err).slice(0, 160)}`, 0, 0);
      }
    } finally {
      inFlightRef.current = false;
      if (dirtyRef.current) maybeTriggerQueryRef.current();
    }
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
  maybeTriggerQueryRef.current = maybeTriggerQuery;

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
        // Permission probe only — Web Speech opens its own capture, so release immediately.
        const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
        probe.getTracks().forEach((t) => t.stop());
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
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader
        icon={Stethoscope}
        title="EM Copilot"
        subtitle="Live decision support — speak or type a patient presentation"
        iconTone="bg-purple-50 text-purple-600"
        actions={
          <span className={`status-pill uppercase tracking-wide ${STATUS_STYLES[status]}`}>
            {(status === 'listening' || status === 'thinking') && (
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            )}
            {statusText}
          </span>
        }
      />

      {/* Glasses hero — what the simulated display below represents */}
      <div className="panel overflow-hidden flex flex-col sm:flex-row items-stretch">
        <div className="p-5 flex-1 flex flex-col justify-center">
          <p className="text-xs font-bold tracking-widest uppercase text-purple-500 mb-1">Heads-up decision support</p>
          <h2 className="text-lg font-semibold text-gray-900">Built for smart glasses at the bedside</h2>
          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
            Guidance is paged into short, glanceable cues sized for a heads-up lens display.
            The black panel below simulates exactly what the wearer sees.
          </p>
        </div>
        <img
          src={copilotGlasses}
          alt="Smart glasses with a heads-up clinical display"
          className="w-full sm:w-72 h-40 sm:h-auto object-cover select-none"
        />
      </div>

      <div className="panel p-4 border-l-4 border-l-amber-400 bg-amber-50/60 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>Trial use — synthetic / de-identified cases only.</strong> Do not enter real patient
          names, MRNs, or other identifiers. This is decision support, not a medical device.
        </p>
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
      <div className="panel p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={toggleListen}
            disabled={!speechSupported}
            className={`btn ${listening ? 'btn-danger-soft' : 'btn-success'}`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {listening ? 'Stop listening' : 'Start listening'}
          </button>
          <button onClick={nextPage} disabled={pageCount <= 1} className="btn btn-secondary">
            <ChevronRight className="w-4 h-4" />
            {pageCount > 1 ? `Next page (${pageLabel})` : 'Next page'}
          </button>
          <button onClick={clearAll} className="btn btn-secondary">
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {speechSupported
            ? 'Uses your browser microphone (Chrome or Edge). Guidance fires automatically as context builds.'
            : 'Speech recognition is not supported in this browser — use the text box below (Chrome or Edge for mic).'}
        </p>
      </div>

      {/* Transcript (operator view) */}
      <div className="panel p-4">
        <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">
          <FileText className="w-3.5 h-3.5" />
          Transcript (operator view only — not shown on glasses)
        </p>
        <p className="text-base leading-relaxed whitespace-pre-wrap break-words min-h-[3em]">
          <span>{finalDisplay}</span>
          <span className="text-gray-400">{interimDisplay}</span>
        </p>
      </div>

      {/* Manual entry */}
      <div className="panel p-4">
        <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">
          <Keyboard className="w-3.5 h-3.5" />
          Or type a scenario
        </p>
        <textarea
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="e.g. 45M crushing chest pain radiating to left arm, diaphoretic, BP 90/60…"
          className="w-full min-h-[72px] rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <div className="mt-2">
          <button onClick={submitManual} className="btn btn-primary">
            <Send className="w-4 h-4" />
            Submit typed text
          </button>
        </div>
      </div>

      {/* Full guidance card */}
      {guidanceHtml && (
        <div className="panel p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Clinical guidance (consider)
          </p>
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
