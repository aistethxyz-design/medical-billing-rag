/**
 * Act II — the copilot at work: live transcript, intelligent highlighting,
 * RAG retrieval, follow-up guidance and reassurance.
 */
import { motion, useTransform, MotionValue } from "framer-motion";
import {
  Scene,
  Grain,
  Vignette,
  HudFrame,
  Micro,
  MMicro,
  Dot,
  GlassCard,
  LiveWords,
  Waveform,
  Segment,
} from "./shared";
import consultPov from "@/assets/consult-pov.png";

/* ── Scene 3 · live transcript + first clinical cue ───────────────────── */

const PATIENT_LINE: Segment[] = [
  { t: "I've had this " },
  { t: "pressure in my chest", hl: true },
  { t: " for about " },
  { t: "three days", hl: true },
  { t: ", but it gets " },
  { t: "worse when I walk upstairs", hl: true },
  { t: "." },
];

function TranscriptStage({ p }: { p: MotionValue<number> }) {
  const dim = useTransform(p, [0, 0.2], [0.55, 0.35]);
  const caption = useTransform(p, [0.02, 0.1, 0.24, 0.32], [0, 1, 1, 0]);
  const panel = useTransform(p, [0.08, 0.18], [0, 1]);
  const panelY = useTransform(p, [0.08, 0.18], [30, 0]);
  const wave = useTransform(p, [0.16, 0.22, 0.56, 0.62], [0, 1, 1, 0.35]);
  const tag = useTransform(p, [0.66, 0.74], [0, 1]);
  const tagY = useTransform(p, [0.66, 0.74], [8, 0]);
  const cue = useTransform(p, [0.78, 0.88], [0, 1]);
  const cueX = useTransform(p, [0.78, 0.88], [48, 0]);

  return (
    <div className="h-full bg-[#04090b]">
      <motion.img
        src={consultPov}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: dim, scale: 1.02 }}
      />
      <HudFrame opacity={1} tint={0.1} />
      <Vignette />
      <Grain />

      <motion.div
        style={{ opacity: caption }}
        className="absolute inset-x-0 top-[14vh] z-30 px-6 text-center"
      >
        <p className="text-lg font-light text-white/90 sm:text-2xl">
          As he speaks, his words live in your lens.
        </p>
        <Micro className="mt-2 block text-white/50">
          Live transcription · on-device stream
        </Micro>
      </motion.div>

      {/* transcript panel */}
      <motion.div
        style={{ opacity: panel, y: panelY }}
        className="absolute inset-x-0 bottom-[9vh] z-30 mx-auto w-[min(92vw,780px)]"
      >
        <div className="rounded-2xl border border-white/10 bg-[#061009]/75 p-5 backdrop-blur-md sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dot />
              <Micro className="text-hud/90">Patient · live</Micro>
            </div>
            <Waveform opacity={wave} />
          </div>
          <p className="mt-3 text-lg leading-relaxed text-white/90 sm:text-2xl sm:leading-relaxed">
            <LiveWords
              p={p}
              segments={PATIENT_LINE}
              start={0.2}
              end={0.56}
              hlStart={0.6}
              hlEnd={0.68}
            />
            <motion.span style={{ opacity: wave }} className="inline-block">
              <span className="caret ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-hud/80" />
            </motion.span>
          </p>

          {/* extracted concept tag */}
          <motion.div
            style={{ opacity: tag, y: tagY }}
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <Micro className="text-white/45">Recognized</Micro>
            <span className="rounded-full border border-hud/40 bg-hud/10 px-3 py-1 font-mono text-[11px] tracking-wider text-hud">
              exertional chest discomfort
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] tracking-wider text-white/60">
              duration · 3 days
            </span>
          </motion.div>
        </div>

        {/* clinical cue slides in from the lens edge */}
        <motion.div style={{ opacity: cue, x: cueX }} className="mt-3 sm:ml-auto sm:w-[420px]">
          <GlassCard label={<><span className="mr-1.5">◆</span>Clinical cue</>}>
            Exertional symptoms may warrant further cardiovascular assessment.
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              Knowledge base · chest pain pathway
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ── Scene 4 · the RAG engine, behind the lens ────────────────────────── */

const DOCS = [
  "Acute chest pain — risk stratification",
  "Cardiac red flags — primary assessment",
  "Anginal equivalents & atypical presentation",
  "Indications for early ECG & troponin",
];

const FOLLOWUPS = [
  "Ask — radiation to arm or jaw?",
  "Ask — shortness of breath?",
  "Ask — sweating or nausea?",
];

function RagStage({ p }: { p: MotionValue<number> }) {
  const copy = useTransform(p, [0.03, 0.12], [0, 1]);
  const query = useTransform(p, [0.14, 0.22], [0, 1]);
  const queryScale = useTransform(p, [0.14, 0.22], [0.9, 1]);
  const answers = useTransform(p, [0.62, 0.72], [0, 1]);
  const answersY = useTransform(p, [0.62, 0.72], [24, 0]);

  return (
    <div className="flex h-full items-center justify-center bg-[#03070a]">
      {/* deep-space grid to signal "inside the machine" */}
      <div aria-hidden className="hud-grid absolute inset-0 opacity-40" />
      <HudFrame opacity={0.5} tint={0.06} />
      <Grain />
      <Vignette strength={0.85} />

      <div className="relative z-30 mx-auto grid w-[min(94vw,1100px)] gap-10 px-4 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <motion.div style={{ opacity: copy }}>
          <Micro className="text-hud/80">Behind the lens</Micro>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-4xl">
            A medical RAG engine reads the moment.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60 sm:text-base">
            Every flagged phrase becomes a query against a curated clinical
            knowledge base. Retrieval happens continuously — but only what
            matters right now is allowed to surface.
          </p>
        </motion.div>

        <div className="relative">
          {/* the query */}
          <motion.div
            style={{ opacity: query, scale: queryScale }}
            className="mx-auto w-fit rounded-full border border-hud/50 bg-hud/10 px-4 py-2 font-mono text-[12px] tracking-wider text-hud shadow-[0_0_30px_rgba(74,222,158,0.25)]"
          >
            exertional chest discomfort
          </motion.div>

          {/* retrieved documents fly up from depth */}
          <div className="mt-6 grid gap-2.5">
            {DOCS.map((d, i) => {
              const a = 0.26 + i * 0.09;
              return <DocRow key={d} p={p} at={[a, a + 0.08]} title={d} idx={i} />;
            })}
          </div>

          {/* synthesized output: follow-up suggestions */}
          <motion.div style={{ opacity: answers, y: answersY }} className="mt-6">
            <Micro className="text-white/45">Suggested follow-ups</Micro>
            <div className="mt-2 flex flex-wrap gap-2">
              {FOLLOWUPS.map((f) => (
                <span
                  key={f}
                  className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[13px] text-white/85 backdrop-blur-sm"
                >
                  {f}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function DocRow({
  p,
  at,
  title,
  idx,
}: {
  p: MotionValue<number>;
  at: [number, number];
  title: string;
  idx: number;
}) {
  const opacity = useTransform(p, at, [0, 1]);
  const y = useTransform(p, at, [26, 0]);
  const scale = useTransform(p, at, [0.94, 1]);
  return (
    <motion.div
      style={{ opacity, y, scale }}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a1512]/70 px-4 py-3 backdrop-blur-sm"
    >
      <span className="font-mono text-[10px] text-hud/70">{`0${idx + 1}`}</span>
      <span className="text-sm text-white/85">{title}</span>
      <span className="ml-auto h-1 w-1 rounded-full bg-hud/70" />
    </motion.div>
  );
}

/* ── Scene 5 · the doctor asks; the copilot reassures ─────────────────── */

const DOCTOR_LINE: Segment[] = [
  { t: "Does it spread to your arm or jaw — any shortness of breath when it happens?" },
];

function ReassureStage({ p }: { p: MotionValue<number> }) {
  const dim = useTransform(p, [0, 0.15], [0.3, 0.5]);
  const panel = useTransform(p, [0.05, 0.14], [0, 1]);
  const check1 = useTransform(p, [0.5, 0.56], [0, 1]);
  const check2 = useTransform(p, [0.58, 0.64], [0, 1]);
  const card = useTransform(p, [0.7, 0.8], [0, 1]);
  const cardScale = useTransform(p, [0.7, 0.8], [0.94, 1]);
  const caption = useTransform(p, [0.84, 0.92], [0, 1]);

  return (
    <div className="h-full bg-[#04090b]">
      <motion.img
        src={consultPov}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: dim, scale: 1.02 }}
      />
      <HudFrame opacity={1} tint={0.1} />
      <Vignette />
      <Grain />

      <div className="absolute inset-x-0 top-[12vh] z-30 mx-auto w-[min(92vw,780px)] px-2">
        {/* doctor's spoken question */}
        <motion.div
          style={{ opacity: panel }}
          className="ml-auto w-fit max-w-full rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4 backdrop-blur-md"
        >
          <Micro className="text-sky-300/90">You · speaking</Micro>
          <p className="mt-2 text-base font-light italic text-white/90 sm:text-xl">
            <LiveWords p={p} segments={DOCTOR_LINE} start={0.16} end={0.46} />
          </p>
        </motion.div>

        {/* follow-ups ticking off */}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <CheckChip opacity={check1} text="radiation to arm or jaw" />
          <CheckChip opacity={check2} text="shortness of breath" />
        </div>
      </div>

      {/* reassurance */}
      <motion.div
        style={{ opacity: card, scale: cardScale }}
        className="absolute inset-x-0 bottom-[14vh] z-30 mx-auto w-[min(92vw,480px)]"
      >
        <GlassCard
          label={
            <>
              AI reassurance <span className="ml-1 text-hud">✓</span>
            </>
          }
          className="shadow-[0_0_60px_rgba(74,222,158,0.15)]"
        >
          Your current line of questioning is addressing the key red-flag
          features.
        </GlassCard>
        <motion.p
          style={{ opacity: caption }}
          className="mt-4 text-center text-sm text-white/50"
        >
          It doesn&rsquo;t interrupt. It confirms.
        </motion.p>
      </motion.div>
    </div>
  );
}

function CheckChip({
  opacity,
  text,
}: {
  opacity: MotionValue<number>;
  text: string;
}) {
  return (
    <motion.span
      style={{ opacity }}
      className="flex items-center gap-1.5 rounded-lg border border-hud/30 bg-hud/10 px-3 py-1.5 text-[13px] text-hud"
    >
      <span className="text-[11px]">✓</span> {text}
    </motion.span>
  );
}

/* ── exported act ─────────────────────────────────────────────────────── */

export function ActCopilot() {
  return (
    <>
      <Scene height={420}>{(p) => <TranscriptStage p={p} />}</Scene>
      <Scene height={330}>{(p) => <RagStage p={p} />}</Scene>
      <Scene height={300}>{(p) => <ReassureStage p={p} />}</Scene>
    </>
  );
}
