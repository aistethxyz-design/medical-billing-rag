/**
 * Act II — the copilot working through one consultation.
 *
 * The patient stays pinned for the whole act: time passes *inside* the
 * encounter rather than the page sliding past a picture. Information is
 * preserved rather than destroyed — the phrase highlighted in the transcript
 * becomes the extracted finding, which becomes the cue, which becomes the
 * resolved item. Nothing here claims a fact the scripted conversation has not
 * established.
 */
import { motion, useTransform, MotionValue, useReducedMotion } from "framer-motion";
import type { BeatSpec } from "./clock";
import {
  Scene,
  SafeLayer,
  StageProps,
  Beat,
  Plate,
  useBeat,
  Vignette,
  HudFrame,
  Micro,
  Dot,
  GlassCard,
  LiveWords,
  Waveform,
  ProvTag,
  Segment,
} from "./shared";
import { PATIENT_WARM } from "./images";
import { RetrievalWeb, Connector, DrawnFrame } from "./lineart";

/* ── Scene 3 · listening & understanding ──────────────────────────────── */

const PATIENT_LINE: Segment[] = [
  { t: "I've had this " },
  { t: "pressure in my chest", hl: true },
  { t: " since " },
  { t: "yesterday evening", hl: true },
  { t: ", and it hasn't really settled." },
];

const LISTEN_SPEC: readonly BeatSpec[] = [
  { kind: "lead", vh: 0 },
  { kind: "beat", id: "caption" },
  { kind: "words", id: "line", count: 17 },
  { kind: "beat", id: "highlight" },
  { kind: "tick", id: "extract", count: 2 },
  // The context panel and its rows share one group, so the card can never
  // appear as an empty box waiting for its contents.
  { kind: "tick", id: "context", count: 5 },
  { kind: "beat", id: "quiet", terminal: true },
];

const CONTEXT_ROWS: [string, string][] = [
  ["Chest pressure", "central, non-radiating so far"],
  ["Onset", "~18 hours"],
  ["Severity", "5 / 10"],
  ["Exertional relationship", "not yet established"],
];

function ListenStage({ p, tl }: StageProps) {
  const reduced = useReducedMotion();
  const imgScale = useTransform(p, [0, 1], [1.02, 1.08]);
  const dim = useTransform(p, [0, 0.25], [0.5, 0.72]);
  const wave = useTransform(p, tl.range("line").fade, [0, 1, 1, 0.3]);
  const quiet = useBeat({ p, tl }, "quiet");
  // The AI dims itself when it has nothing useful to add.
  const hudCalm = useTransform(quiet.opacity, [0, 1], [1, 0.25]);
  // The panel arrives with the first word, never as an empty box waiting.
  const lineStart = tl.range("line").start;
  const panelIn = useTransform(p, [Math.max(0, lineStart - 0.06), lineStart], [0, 1]);

  return (
    <>
      <Plate
        plate={PATIENT_WARM}
        alt=""
        style={reduced ? undefined : { scale: imgScale, willChange: "transform" }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-0 z-[21] bg-[#050d10]"
        style={reduced ? { opacity: 0.6 } : { opacity: dim }}
      />
      <HudFrame opacity={reduced ? 1 : hudCalm} tint={0.08} />
      <Vignette strength={0.7} />

      <SafeLayer>
        <Beat
          p={p}
          tl={tl}
          id="caption"
          className="film-abs-only absolute inset-x-0 top-[8vh] z-30 px-6 text-center"
          y={10}
        >
          <p className="text-lg font-light text-white sm:text-2xl">
            He speaks. It listens.
          </p>
        </Beat>

        <motion.div
          style={reduced ? undefined : { opacity: hudCalm }}
          className="absolute inset-x-0 bottom-[7vh] z-30 mx-auto w-[min(92vw,820px)] px-2"
        >
          {/* live transcript */}
          <motion.div
            style={reduced ? undefined : { opacity: panelIn }}
            className="rounded-2xl border border-white/12 bg-[#071310]/85 p-5 backdrop-blur-sm sm:p-6"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Dot />
                <Micro className="text-hud">Patient · live</Micro>
              </span>
              <Waveform opacity={reduced ? 1 : wave} />
            </div>
            <p className="mt-3 text-lg leading-relaxed text-white/90 sm:text-2xl sm:leading-relaxed">
              <LiveWords
                p={p}
                tl={tl}
                id="line"
                segments={PATIENT_LINE}
                hlId="highlight"
              />
            </p>

            {/* the highlighted phrases become structured findings */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ProvTag kind="conversation" />
              <Extracted p={p} tl={tl} i={0} text="Chest pressure" />
              <Extracted p={p} tl={tl} i={1} text="Onset · yesterday evening" />
            </div>
          </motion.div>

          {/* structured understanding — not a transcript, a clinical picture */}
          <ContextPanel p={p} tl={tl} />
        </motion.div>

        {/* restraint: the interface recedes when there is nothing to add */}
        <Beat
          p={p}
          tl={tl}
          id="quiet"
          className="film-abs-only absolute right-[6vw] top-[8vh] z-30"
          x={14}
        >
          <span className="flex items-center gap-2 rounded-full border border-white/15 bg-[#050d10]/70 px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <Micro className="text-white/60">Listening · no action needed</Micro>
          </span>
        </Beat>
      </SafeLayer>
    </>
  );
}

/** Panel and first row rise together; remaining rows follow. */
function ContextPanel({ p, tl }: { p: MotionValue<number>; tl: StageProps["tl"] }) {
  const reduced = useReducedMotion();
  const r = tl.sub("context", 0);
  const opacity = useTransform(p, r.enter, [0, 1]);
  const y = useTransform(p, r.enter, [16, 0]);
  return (
    <motion.div style={reduced ? undefined : { opacity, y }} className="mt-3">
      <GlassCard label="Encounter context" blur>
        <dl className="grid gap-1.5">
          {CONTEXT_ROWS.map(([k, v], i) => (
            <ContextRow key={k} p={p} tl={tl} i={i + 1} k={k} v={v} />
          ))}
        </dl>
      </GlassCard>
    </motion.div>
  );
}

function Extracted({
  p,
  tl,
  i,
  text,
}: {
  p: MotionValue<number>;
  tl: StageProps["tl"];
  i: number;
  text: string;
}) {
  const reduced = useReducedMotion();
  const r = tl.sub("extract", i);
  const opacity = useTransform(p, r.enter, [0, 1]);
  // Rises out of the transcript line above it, rather than appearing from nowhere.
  const y = useTransform(p, r.enter, [-14, 0]);
  const scale = useTransform(p, r.enter, [0.94, 1]);
  return (
    <motion.span
      style={reduced ? undefined : { opacity, y, scale }}
      className="rounded-full border border-hud/45 bg-hud/12 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-hud"
    >
      {text}
    </motion.span>
  );
}

function ContextRow({
  p,
  tl,
  i,
  k,
  v,
}: {
  p: MotionValue<number>;
  tl: StageProps["tl"];
  i: number;
  k: string;
  v: string;
}) {
  const reduced = useReducedMotion();
  const r = tl.sub("context", i);
  const opacity = useTransform(p, r.enter, [0, 1]);
  const x = useTransform(p, r.enter, [10, 0]);
  const pending = v.includes("not yet");
  return (
    <motion.div
      style={reduced ? undefined : { opacity, x }}
      className="grid gap-0.5 sm:grid-cols-[190px_1fr] sm:items-baseline sm:gap-3"
    >
      <Micro className={pending ? "text-amber-200/90" : "text-white/60"}>{k}</Micro>
      <span className={`text-sm ${pending ? "text-amber-100/90" : "text-white/85"}`}>{v}</span>
    </motion.div>
  );
}

/* ── Scene 4 · retrieval + chart context ──────────────────────────────── */

const RETRIEVE_SPEC: readonly BeatSpec[] = [
  { kind: "lead", vh: 0 },
  { kind: "beat", id: "intro" },
  { kind: "beat", id: "searching" },
  { kind: "tick", id: "refs", count: 4 },
  { kind: "beat", id: "chart" },
  { kind: "tick", id: "chartrows", count: 3 },
  { kind: "beat", id: "synth", terminal: true },
];

const REFS = [
  "Acute chest pain — risk stratification",
  "Anginal equivalents & atypical presentation",
  "Cardiac red flags — primary assessment",
  "Indications for early ECG & troponin",
];

const CHART_ROWS: [string, string][] = [
  ["Hypertension", "on treatment"],
  ["Family history", "CAD — father, age 61"],
  ["Previous visit", "elevated BP"],
];

function RetrieveStage({ p, tl }: StageProps) {
  const reduced = useReducedMotion();
  const searching = useBeat({ p, tl }, "searching");
  const refsIn = useTransform(p, tl.sub("refs", 0).enter, [0, 1]);
  // The drawn layer runs slightly ahead of the cards it explains.
  const webDraw = useTransform(p, [tl.range("searching").start, tl.sub("refs", 3).end], [0, 1]);
  const frameDraw = useTransform(p, [0, 0.12], [0, 1]);

  return (
    <>
      <div aria-hidden className="absolute inset-0 bg-[#050b0e]" />
      <div aria-hidden className="hud-grid absolute inset-0 opacity-30" />
      {/* retrieval, drawn: the query reaching out into the index and pulling
          a few passages back. The whole scene is the AI layer, so the line
          work carries it rather than sitting on a photograph. */}
      <div className="film-abs-only absolute inset-0 z-[15]">
        <RetrievalWeb t={webDraw} />
      </div>
      <DrawnFrame t={frameDraw} tint={0.04} />
      <Vignette strength={0.8} />

      <SafeLayer>
        <div className="relative z-30 mx-auto flex h-full w-[min(94vw,1080px)] items-center px-4">
          <div className="grid w-full gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <Beat p={p} tl={tl} id="intro" y={14} oneWay>
              <Micro className="text-hud">Behind the lens</Micro>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-4xl">
                It doesn&rsquo;t just hear him.
                <span className="block text-white/70">It looks things up.</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
                Findings from the conversation query a curated emergency-medicine
                index — 32,978 passages — alongside this patient&rsquo;s own chart.
                Retrieval runs continuously; almost none of it is ever shown.
              </p>
            </Beat>

            <div className="space-y-4">
              {/* retrieval — small, fast, not a database console */}
              <Beat p={p} tl={tl} id="searching" y={12} oneWay>
                <GlassCard label={<><ProvTag kind="knowledge" /></>}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-[13px] text-white/85">
                      chest pressure · exertional relationship
                    </span>
                  </div>
                  <div className="relative mt-3 h-px w-full overflow-hidden bg-white/10">
                    <motion.span
                      aria-hidden
                      style={reduced ? undefined : { opacity: searching.opacity }}
                      className="trace-run absolute inset-y-0 left-0 w-1/4 bg-hud/70"
                    />
                  </div>
                  <motion.p
                    style={reduced ? undefined : { opacity: refsIn }}
                    className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-hud"
                  >
                    4 relevant references
                  </motion.p>
                </GlassCard>
              </Beat>

              <div className="grid gap-2">
                {REFS.map((r, i) => (
                  <RefRow key={r} p={p} tl={tl} i={i} title={r} />
                ))}
              </div>

              {/* chart context — visually distinct provenance */}
              <Beat p={p} tl={tl} id="chart" y={14} oneWay>
                <GlassCard label={<ProvTag kind="chart" />}>
                  <dl className="grid gap-1.5">
                    {CHART_ROWS.map(([k, v], i) => (
                      <ChartRow key={k} p={p} tl={tl} i={i} k={k} v={v} />
                    ))}
                  </dl>
                </GlassCard>
              </Beat>
            </div>
          </div>
        </div>

        <Beat
          p={p}
          tl={tl}
          id="synth"
          className="film-abs-only absolute inset-x-0 bottom-[7vh] z-30 px-6 text-center"
          y={10}
        >
          <p className="mx-auto max-w-2xl text-base font-light text-white/90 sm:text-xl">
            Live conversation, this patient&rsquo;s history, and the evidence —
            held together at once.
          </p>
        </Beat>
      </SafeLayer>
    </>
  );
}

function RefRow({
  p,
  tl,
  i,
  title,
}: {
  p: MotionValue<number>;
  tl: StageProps["tl"];
  i: number;
  title: string;
}) {
  const reduced = useReducedMotion();
  const r = tl.sub("refs", i);
  const opacity = useTransform(p, r.enter, [0, 1]);
  const y = useTransform(p, r.enter, [18, 0]);
  const scale = useTransform(p, r.enter, [0.96, 1]);
  return (
    <motion.div
      style={reduced ? undefined : { opacity, y, scale }}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1a16]/70 px-4 py-2.5"
    >
      <span className="font-mono text-[10px] text-hud/80">{`0${i + 1}`}</span>
      <span className="text-[13px] text-white/85">{title}</span>
    </motion.div>
  );
}

function ChartRow({
  p,
  tl,
  i,
  k,
  v,
}: {
  p: MotionValue<number>;
  tl: StageProps["tl"];
  i: number;
  k: string;
  v: string;
}) {
  const reduced = useReducedMotion();
  const r = tl.sub("chartrows", i);
  const opacity = useTransform(p, r.enter, [0, 1]);
  const x = useTransform(p, r.enter, [10, 0]);
  return (
    <motion.div
      style={reduced ? undefined : { opacity, x }}
      className="grid gap-0.5 sm:grid-cols-[150px_1fr] sm:items-baseline sm:gap-3"
    >
      <Micro className="text-sky-200/80">{k}</Micro>
      <span className="text-sm text-white/85">{v}</span>
    </motion.div>
  );
}

/* ── Scene 5 · the cue, the question, the resolution ──────────────────── */

const DOCTOR_LINE: Segment[] = [
  { t: "Does it get worse when you're walking or climbing stairs?" },
];

const CUE_SPEC: readonly BeatSpec[] = [
  { kind: "lead", vh: 0 },
  { kind: "beat", id: "cue" },
  { kind: "words", id: "ask", count: 10 },
  { kind: "beat", id: "listening" },
  { kind: "beat", id: "addressed" },
  { kind: "beat", id: "support" },
  { kind: "tick", id: "aligned", count: 3 },
  { kind: "beat", id: "incomplete", terminal: true },
];

function CueStage({ p, tl }: StageProps) {
  const reduced = useReducedMotion();
  const imgScale = useTransform(p, [0, 1], [1.06, 1.02]);
  // The cue persists and transforms rather than being replaced, so the sequence
  // cue → listening → addressed reverses cleanly when scrolled back up.
  const cue = useBeat({ p, tl }, "cue", { y: 14, oneWay: true });
  const listening = useBeat({ p, tl }, "listening", { oneWay: true });
  const addressed = useBeat({ p, tl }, "addressed", { oneWay: true });

  // One card, three states — it transforms rather than being replaced, so the
  // whole sequence reverses cleanly when the visitor scrolls back up.
  const cueBorder = useTransform(
    addressed.opacity,
    [0, 1],
    ["rgba(251,191,36,0.45)", "rgba(74,222,158,0.55)"],
  );
  const glow = useTransform(addressed.opacity, [0, 1], [0, 0.35]);
  // Unresolved copy fades out as the resolved copy fades in, in the same box.
  const unresolvedOut = useTransform(addressed.opacity, [0, 0.6], [1, 0]);
  // The link draws while the physician is asking, then holds.
  const linkDraw = useTransform(p, [tl.range("ask").start, tl.range("listening").end], [0, 1]);
  const frameDraw = useTransform(p, [0, 0.1], [0, 1]);

  return (
    <>
      <Plate
        plate={PATIENT_WARM}
        alt=""
        style={reduced ? undefined : { scale: imgScale, willChange: "transform" }}
      />
      <div aria-hidden className="absolute inset-0 z-[21] bg-[#050d10]/70" />
      {/* the reasoning made visible: a line from the question the physician
          asked down to the cue it resolves */}
      <div className="film-abs-only absolute inset-0 z-[24]">
        <Connector t={linkDraw} from={{ x: 72, y: 30 }} to={{ x: 30, y: 52 }} />
      </div>
      <DrawnFrame t={frameDraw} tint={0.06} />
      <Vignette strength={0.7} />

      <SafeLayer>
        <div className="relative z-30 mx-auto flex h-full w-[min(92vw,760px)] flex-col justify-center px-2">
          {/* the physician's own question, spoken naturally */}
          <Beat p={p} tl={tl} id="ask" className="mb-5 ml-auto max-w-[85%]" y={10} oneWay>
            <div className="rounded-2xl border border-white/12 bg-white/[0.08] px-5 py-4 backdrop-blur-sm">
              <Micro className="text-sky-200">You · speaking</Micro>
              <p className="mt-2 text-base font-light italic leading-relaxed text-white sm:text-xl">
                <LiveWords p={p} tl={tl} id="ask" segments={DOCTOR_LINE} />
              </p>
            </div>
          </Beat>

          {/* the cue card: unresolved → listening → addressed */}
          <motion.div
            style={
              reduced
                ? undefined
                : { opacity: cue.opacity, y: cue.y, borderColor: cueBorder }
            }
            className="relative rounded-xl border bg-[#0b1a16]/88 p-5"
          >
            <motion.div
              aria-hidden
              style={reduced ? undefined : { opacity: glow }}
              className="pointer-events-none absolute inset-0 rounded-xl bg-hud/10 shadow-[0_0_50px_rgba(74,222,158,0.35)]"
            />
            <div className="relative">
              <CueHeader
                cue={cue.opacity}
                listening={listening.opacity}
                addressed={addressed.opacity}
                reduced={!!reduced}
              />
              <div className="relative mt-2 min-h-[3.5rem]">
                <motion.div
                  style={reduced ? undefined : { opacity: unresolvedOut }}
                  className={reduced ? "" : "absolute inset-0"}
                >
                  <p className="text-sm leading-relaxed text-white/90 sm:text-[15px]">
                    Exertional relationship not yet established.
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-white/70">
                    Consider clarifying the relationship to activity.
                  </p>
                </motion.div>
                <motion.div
                  style={reduced ? undefined : { opacity: addressed.opacity }}
                  className={reduced ? "mt-3" : "absolute inset-0"}
                >
                  <p className="text-sm leading-relaxed text-white/90 sm:text-[15px]">
                    Exertional component confirmed — worse on stairs.
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-hud/90">
                    Added to the encounter picture.
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* support, not grading */}
          <Beat p={p} tl={tl} id="support" className="mt-4" y={14} oneWay>
            <GlassCard label="Decision support">
              <p className="text-white/85">Your current plan aligns with the retrieved guidance:</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {["ECG", "Troponin", "Repeat vitals"].map((t, i) => (
                  <AlignedChip key={t} p={p} tl={tl} i={i} text={t} />
                ))}
              </div>
            </GlassCard>
          </Beat>

          <Beat p={p} tl={tl} id="incomplete" className="mt-3" y={12}>
            <div className="rounded-xl border border-amber-300/30 bg-amber-400/[0.07] p-4">
              <Micro className="text-amber-200">Still open</Micro>
              <p className="mt-1.5 text-sm text-white/85">
                Risk context not yet covered — smoking history.
              </p>
            </div>
          </Beat>
        </div>
      </SafeLayer>
    </>
  );
}

function CueHeader({
  cue,
  listening,
  addressed,
  reduced,
}: {
  cue: MotionValue<number>;
  listening: MotionValue<number>;
  addressed: MotionValue<number>;
  reduced: boolean;
}) {
  // All three labels occupy the same slot; each is a pure function of scroll, so
  // the sequence plays backwards correctly as well as forwards.
  const cueOnly = useTransform(listening, [0, 1], [1, 0]);
  const listenOnly = useTransform(addressed, [0, 0.5], [1, 0]);
  const listenVisible = useTransform([listening, listenOnly] as const, ([a, b]: number[]) => a * b);

  if (reduced) {
    return <Micro className="text-hud">Clinical cue → addressed</Micro>;
  }
  return (
    <div className="relative h-4">
      <motion.span style={{ opacity: cueOnly }} className="absolute inset-0">
        <Micro className="text-amber-200">◆ Clinical cue</Micro>
      </motion.span>
      <motion.span style={{ opacity: listenVisible }} className="absolute inset-0">
        <Micro className="text-white/70">Listening…</Micro>
      </motion.span>
      <motion.span style={{ opacity: addressed }} className="absolute inset-0">
        <Micro className="text-hud">✓ Addressed</Micro>
      </motion.span>
    </div>
  );
}

function AlignedChip({
  p,
  tl,
  i,
  text,
}: {
  p: MotionValue<number>;
  tl: StageProps["tl"];
  i: number;
  text: string;
}) {
  const reduced = useReducedMotion();
  const r = tl.sub("aligned", i);
  const opacity = useTransform(p, r.enter, [0, 1]);
  const scale = useTransform(p, r.enter, [0.92, 1]);
  return (
    <motion.span
      style={reduced ? undefined : { opacity, scale }}
      className="flex items-center gap-1.5 rounded-lg border border-hud/35 bg-hud/10 px-3 py-1.5 text-[13px] text-hud"
    >
      <span className="text-[11px]">✓</span>
      {text}
    </motion.span>
  );
}

/* ── act ──────────────────────────────────────────────────────────────── */

export function ActCopilot() {
  return (
    <>
      <Scene spec={LISTEN_SPEC} id="ch-understand">{(s) => <ListenStage {...s} />}</Scene>
      <Scene spec={RETRIEVE_SPEC} id="ch-retrieve">{(s) => <RetrieveStage {...s} />}</Scene>
      <Scene spec={CUE_SPEC} id="ch-assist">{(s) => <CueStage {...s} />}</Scene>
    </>
  );
}

export { LISTEN_SPEC, RETRIEVE_SPEC, CUE_SPEC };
