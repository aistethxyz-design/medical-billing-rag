/**
 * Act III — the living patient summary, the pull back out of the lens,
 * the thesis statement, the intelligence-layer breakdown, and the CTA.
 */
import type { ReactNode } from "react";
import { motion, useTransform, MotionValue } from "framer-motion";
import {
  Scene,
  Grain,
  Vignette,
  HudFrame,
  Micro,
  GlassCard,
} from "./shared";
import copilotGlasses from "@/assets/copilot-glasses.png";
import consultWide from "@/assets/consult-wide.png";

/* ── Scene 6 · the living patient summary ─────────────────────────────── */

const SUMMARY_ROWS: {
  k: string;
  v: ReactNode;
  accent?: boolean;
}[] = [
  { k: "Symptoms", v: "chest pressure · 3-day duration · exertional worsening" },
  { k: "Relevant history", v: "hypertension · family cardiac history" },
  { k: "Medications", v: "atorvastatin · amlodipine" },
  {
    k: "Potentially important",
    v: "exertional nature of symptoms",
    accent: true,
  },
  {
    k: "Still unanswered",
    v: (
      <>
        <s className="text-white/35">radiation</s> ·{" "}
        <s className="text-white/35">dyspnea</s> ·{" "}
        <span className="text-amber-300/90">diaphoresis</span>
      </>
    ),
  },
  { k: "Evidence surfaced", v: "4 sources · chest pain pathway" },
];

const GHOST_LINES = [
  "…started on Tuesday, maybe Monday night…",
  "…my father had a stent at sixty…",
  "…I take the cholesterol one, atorvastatin…",
  "…and amlodipine for the blood pressure…",
  "…it's more of a pressure than a pain…",
  "…going up the stairs at work, mostly…",
  "…no, it hasn't spread anywhere…",
  "…not really short of breath, no…",
];

function SummaryStage({ p }: { p: MotionValue<number> }) {
  const ghostY = useTransform(p, [0, 1], ["6%", "-38%"]);
  const copy = useTransform(p, [0.04, 0.12], [0, 1]);
  const panel = useTransform(p, [0.1, 0.18], [0, 1]);
  const panelY = useTransform(p, [0.1, 0.18], [30, 0]);

  return (
    <div className="h-full bg-[#03080a]">
      <HudFrame opacity={0.65} tint={0.07} />
      <Grain />
      <Vignette strength={0.85} />

      {/* the raw encounter, drifting by — you never have to reread it */}
      <motion.div
        aria-hidden
        style={{ y: ghostY }}
        className="absolute left-[5vw] top-0 z-10 hidden w-[36vw] select-none flex-col gap-7 py-24 lg:flex"
      >
        {GHOST_LINES.concat(GHOST_LINES).map((l, i) => (
          <p key={i} className="text-lg font-light leading-snug text-white/[0.09] blur-[1px]">
            {l}
          </p>
        ))}
      </motion.div>

      <div className="relative z-30 flex h-full items-center">
        <div className="mx-auto grid w-[min(94vw,1100px)] gap-10 px-4 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <motion.div style={{ opacity: copy }}>
            <Micro className="text-hud/80">While you talk</Micro>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:text-4xl">
              The encounter condenses itself.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60 sm:text-base">
              No rereading the transcript. The copilot maintains a living
              summary of what has been established, what changed the picture,
              and what still needs to be asked.
            </p>
          </motion.div>

          <motion.div
            style={{ opacity: panel, y: panelY }}
            className="rounded-2xl border border-white/10 bg-[#071009]/80 p-5 backdrop-blur-md sm:p-6"
          >
            <div className="flex items-center justify-between">
              <Micro className="text-hud">Living patient summary</Micro>
              <Micro className="text-white/35">Auto · updating</Micro>
            </div>
            <div className="mt-4 grid gap-2.5">
              {SUMMARY_ROWS.map((r, i) => {
                const a = 0.22 + i * 0.09;
                return (
                  <SummaryRow key={r.k} p={p} at={[a, a + 0.08]} row={r} />
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  p,
  at,
  row,
}: {
  p: MotionValue<number>;
  at: [number, number];
  row: (typeof SUMMARY_ROWS)[number];
}) {
  const opacity = useTransform(p, at, [0, 1]);
  const x = useTransform(p, at, [16, 0]);
  return (
    <motion.div
      style={{ opacity, x }}
      className={`grid gap-0.5 rounded-lg border px-3.5 py-2.5 sm:grid-cols-[170px_1fr] sm:items-baseline sm:gap-3 ${
        row.accent
          ? "border-hud/40 bg-hud/[0.08]"
          : "border-white/[0.07] bg-white/[0.03]"
      }`}
    >
      <Micro className={row.accent ? "text-hud" : "text-white/45"}>{row.k}</Micro>
      <span className="text-[13.5px] text-white/85 sm:text-sm">{row.v}</span>
    </motion.div>
  );
}

/* ── Scene 7 · pull back out of the lens ──────────────────────────────── */

function ZoomOutStage({ p }: { p: MotionValue<number> }) {
  // the HUD world shrinks away…
  const hudScale = useTransform(p, [0, 0.26], [1, 0.1]);
  const hudOpacity = useTransform(p, [0, 0.18, 0.26], [1, 0.6, 0]);
  // …revealing the room in third person: the doctor never looked away
  const wide = useTransform(p, [0.1, 0.26], [0, 1]);
  const wideScale = useTransform(p, [0.1, 0.6], [1.14, 1.02]);
  const wideDim = useTransform(p, [0.52, 0.66], [0.25, 0.75]);
  const sA = useTransform(p, [0.3, 0.4, 0.52, 0.6], [0, 1, 1, 0]);
  // …then the glasses themselves, where it all lived
  const img = useTransform(p, [0.6, 0.72], [0, 1]);
  const imgScale = useTransform(p, [0.6, 1], [1.1, 1]);
  const s1 = useTransform(p, [0.66, 0.74, 0.82, 0.88], [0, 1, 1, 0]);
  const s2 = useTransform(p, [0.88, 0.96], [0, 1]);

  return (
    <div className="flex h-full items-center justify-center bg-[#04090b]">
      <motion.img
        src={consultWide}
        alt="The doctor, wearing smart glasses, keeps warm eye contact with the patient"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ scale: wideScale, opacity: wide }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[#04090b]"
        style={{ opacity: wideDim }}
      />
      <motion.img
        src={copilotGlasses}
        alt="Smart glasses on a table, HUD glowing faintly in one lens"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: img, scale: imgScale, filter: "brightness(0.55)" }}
      />
      {/* darkens under the closing statements so they stay legible */}
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[#04090b]"
        style={{ opacity: useTransform(p, [0.62, 0.8], [0, 0.5]) }}
      />
      <Vignette />
      <Grain />

      {/* miniature HUD collapsing into the lens */}
      <motion.div
        aria-hidden
        style={{ scale: hudScale, opacity: hudOpacity }}
        className="absolute z-20 h-[70vh] w-[min(90vw,900px)] rounded-3xl border-2 border-hud/50 bg-[#061009]/70 backdrop-blur-sm"
      >
        <div className="absolute left-4 top-4 h-8 w-8 rounded-tl-md border-l-2 border-t-2 border-hud/70" />
        <div className="absolute right-4 top-4 h-8 w-8 rounded-tr-md border-r-2 border-t-2 border-hud/70" />
        <div className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-md border-b-2 border-l-2 border-hud/70" />
        <div className="absolute bottom-4 right-4 h-8 w-8 rounded-br-md border-b-2 border-r-2 border-hud/70" />
        {/* ghost of everything the copilot was holding, collapsing with it */}
        <div className="flex h-full flex-col justify-center gap-3 px-[8%]">
          <Micro className="text-hud/80">Living patient summary</Micro>
          {[82, 64, 71, 46, 58].map((w, i) => (
            <div
              key={i}
              className="h-2.5 rounded-full bg-hud/15"
              style={{ width: `${w}%` }}
            />
          ))}
          <div className="mt-2 flex gap-2">
            <div className="h-6 w-24 rounded-full border border-hud/30 bg-hud/10" />
            <div className="h-6 w-32 rounded-full border border-white/15 bg-white/5" />
          </div>
        </div>
      </motion.div>

      <motion.div style={{ opacity: sA }} className="absolute z-30 px-6 text-center">
        <p className="text-2xl font-light leading-snug text-white sm:text-4xl">
          He never saw a screen.
          <br />
          You never looked away.
        </p>
      </motion.div>

      <motion.div style={{ opacity: s1 }} className="absolute z-30 px-6 text-center">
        <p className="text-2xl font-light leading-snug text-white sm:text-4xl">
          All of that lived inside a pair of glasses.
        </p>
      </motion.div>

      <motion.div style={{ opacity: s2 }} className="absolute z-30 px-6 text-center">
        <p className="text-2xl font-semibold leading-snug text-white sm:text-5xl">
          The doctor stays present with the patient.
        </p>
        <p className="mt-3 text-xl font-light text-hud sm:text-3xl">
          The AI handles the cognitive background work.
        </p>
      </motion.div>
    </div>
  );
}

/* ── Scene 8 · not transcription — an intelligence layer ──────────────── */

const LAYERS: [string, string][] = [
  ["Listens", "Ambient, hands-free capture of the full encounter — no typing, no dictation."],
  ["Retrieves", "Flagged findings query a curated medical knowledge base through RAG, live."],
  ["Flags", "Potentially missed red-flag features surface as quiet, glanceable cues."],
  ["Supports", "Confirms your reasoning when it aligns with the evidence — and only then."],
  ["Summarizes", "A living, decision-relevant summary replaces rereading the transcript."],
];

function LayersSection() {
  return (
    <section className="relative bg-[#03070a] py-28 sm:py-36">
      <Grain opacity={0.04} />
      <div className="mx-auto w-[min(94vw,900px)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <Micro className="text-hud/80">What you just watched</Micro>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-5xl">
            Not transcription.
            <br />
            <span className="text-white/60">
              A real-time clinical intelligence layer.
            </span>
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-3">
          {LAYERS.map(([k, v], i) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="grid gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 backdrop-blur-sm sm:grid-cols-[180px_1fr] sm:items-baseline sm:gap-6 sm:px-7 sm:py-5"
            >
              <span className="font-mono text-sm uppercase tracking-[0.24em] text-hud">
                {k}
              </span>
              <span className="text-[15px] leading-relaxed text-white/75">{v}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Scene 9 · CTA + footer ───────────────────────────────────────────── */

function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#04090b] py-28 text-center sm:py-40">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(74,222,158,0.14) 0%, transparent 70%)",
        }}
      />
      <Grain opacity={0.04} />
      <div className="relative mx-auto w-[min(94vw,700px)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl font-semibold text-white sm:text-5xl">
            Bring a second set of eyes
            <br /> to every encounter.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">
            EM Copilot is in a limited clinical trial with allowlisted
            physicians, using synthetic and de-identified cases.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/app/login?redirect=/em-copilot"
              className="rounded-xl bg-hud px-7 py-3.5 text-sm font-semibold text-[#04140c] transition hover:brightness-110"
            >
              Sign in to wiserdoc
            </a>
            <a
              href="mailto:aistethxyz@gmail.com?subject=EM%20Copilot%20trial%20access"
              className="rounded-xl border border-white/20 px-7 py-3.5 text-sm font-medium text-white/85 transition hover:bg-white/5"
            >
              Request trial access
            </a>
          </div>
          <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.24em] text-white/30">
            Decision support only — the physician retains full clinical judgment
          </p>
        </motion.div>
      </div>
      <footer className="relative mt-20 border-t border-white/[0.06] pt-8">
        <p className="text-xs text-white/35">
          © {new Date().getFullYear()} AISteth · PHIPA-aligned · Ontario
        </p>
      </footer>
    </section>
  );
}

/* ── exported act ─────────────────────────────────────────────────────── */

export function ActOutro() {
  return (
    <>
      <Scene height={380}>{(p) => <SummaryStage p={p} />}</Scene>
      <Scene height={380}>{(p) => <ZoomOutStage p={p} />}</Scene>
      <LayersSection />
      <CtaSection />
    </>
  );
}
