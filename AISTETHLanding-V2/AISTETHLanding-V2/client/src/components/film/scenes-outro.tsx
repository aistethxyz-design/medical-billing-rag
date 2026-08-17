/**
 * Act III — the encounter collapses into structure, the work continues in the
 * background, and the interface finally gets out of the way.
 *
 * Every fact in the summary was established earlier in the scripted encounter.
 * Downstream steps are described as *prepared* / *organized* / *surfaced*,
 * never as autonomously completed, because that is what the product does.
 */
import type { ReactNode } from "react";
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
  GlassCard,
  ProvTag,
} from "./shared";
import { CONSULT_WARM, GLASSES_HERO } from "./images";

/* ── Scene 6 · encounter collapse → structured summary ────────────────── */

const SUMMARY_SPEC: readonly BeatSpec[] = [
  { kind: "lead", vh: 0 },
  { kind: "beat", id: "complete" },
  { kind: "tick", id: "cards", count: 5 },
  { kind: "beat", id: "downstream" },
  { kind: "tick", id: "flow", count: 4 },
  { kind: "beat", id: "close", terminal: true },
];

type Card = { title: string; prov: "conversation" | "chart" | "knowledge"; rows: ReactNode[] };

const CARDS: Card[] = [
  {
    title: "Clinical summary",
    prov: "conversation",
    rows: ["46M", "Chest pressure, central", "Onset ~18 hours", "Exertional component confirmed"],
  },
  {
    title: "Relevant history",
    prov: "chart",
    rows: ["Hypertension, on treatment", "Family history of CAD"],
  },
  {
    title: "Important negatives",
    prov: "conversation",
    rows: ["No radiation to arm or jaw", "No shortness of breath"],
  },
  {
    title: "Investigations",
    prov: "knowledge",
    rows: ["ECG · ordered", "Troponin · ordered", "Repeat vitals"],
  },
  {
    title: "Outstanding",
    prov: "conversation",
    rows: ["Smoking history", "Repeat BP"],
  },
];

const FLOW = [
  "Encounter captured",
  "Clinical summary prepared",
  "Documentation generated for review",
  "Billing codes suggested",
];

function SummaryStage({ p, tl }: StageProps) {
  const reduced = useReducedMotion();
  const complete = useBeat({ p, tl }, "complete");
  // The live HUD converges into a single line before reorganising into cards.
  const converge = useTransform(complete.opacity, [0, 1], [1.06, 1]);

  return (
    <>
      <div aria-hidden className="absolute inset-0 bg-[#050b0e]" />
      <div aria-hidden className="hud-grid absolute inset-0 opacity-25" />
      <HudFrame opacity={0.4} tint={0.05} />
      <Vignette strength={0.8} />

      <SafeLayer>
        <motion.div
          style={reduced ? undefined : { scale: converge }}
          className="relative z-30 mx-auto flex h-full w-[min(94vw,1080px)] flex-col justify-center px-4"
        >
          <Beat p={p} tl={tl} id="complete" className="mb-6 text-center" y={12} oneWay>
            <Micro className="text-hud">Encounter complete · 08:42</Micro>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:text-4xl">
              A live encounter, already organised.
            </h2>
          </Beat>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((c, i) => (
              <SummaryCard key={c.title} p={p} tl={tl} i={i} card={c} />
            ))}

            {/* downstream work — described honestly as prepared, not done */}
            <Beat p={p} tl={tl} id="downstream" y={16} oneWay className="sm:col-span-2 lg:col-span-1">
              <GlassCard label="Background work">
                <ul className="grid gap-1.5">
                  {FLOW.map((f, i) => (
                    <FlowRow key={f} p={p} tl={tl} i={i} text={f} />
                  ))}
                </ul>
                <p className="mt-3 text-[12px] leading-relaxed text-white/60">
                  Everything is prepared for the physician to review — nothing is
                  filed on their behalf.
                </p>
              </GlassCard>
            </Beat>
          </div>
        </motion.div>

        <Beat
          p={p}
          tl={tl}
          id="close"
          className="film-abs-only absolute inset-x-0 bottom-[6vh] z-30 px-6 text-center"
          y={10}
        >
          <p className="mx-auto max-w-2xl text-base font-light text-white/85 sm:text-xl">
            No one had to stop and type any of this.
          </p>
        </Beat>
      </SafeLayer>
    </>
  );
}

function SummaryCard({
  p,
  tl,
  i,
  card,
}: {
  p: MotionValue<number>;
  tl: StageProps["tl"];
  i: number;
  card: Card;
}) {
  const reduced = useReducedMotion();
  const r = tl.sub("cards", i);
  const opacity = useTransform(p, r.enter, [0, 1]);
  const y = useTransform(p, r.enter, [22, 0]);
  const scale = useTransform(p, r.enter, [0.96, 1]);
  return (
    <motion.div
      style={reduced ? undefined : { opacity, y, scale }}
      className="rounded-xl border border-white/10 bg-[#0b1a16]/75 p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <Micro className="text-white/70">{card.title}</Micro>
      </div>
      <ul className="mt-2 grid gap-1">
        {card.rows.map((r2, k) => (
          <li key={k} className="text-[13.5px] leading-snug text-white/85">
            {r2}
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <ProvTag kind={card.prov} />
      </div>
    </motion.div>
  );
}

function FlowRow({
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
  const r = tl.sub("flow", i);
  const opacity = useTransform(p, r.enter, [0, 1]);
  const x = useTransform(p, r.enter, [8, 0]);
  return (
    <motion.li
      style={reduced ? undefined : { opacity, x }}
      className="flex items-center gap-2 text-[13.5px] text-white/85"
    >
      <span className="text-hud/80">↳</span>
      {text}
    </motion.li>
  );
}

/* ── Scene 7 · the interface leaves; the consultation remains ─────────── */

const CLOSE_SPEC: readonly BeatSpec[] = [
  { kind: "lead", vh: 0 },
  { kind: "beat", id: "present" },   // "He never stopped looking at his patient."
  { kind: "beat", id: "eyes" },      // "A second set of eyes…"
  { kind: "beat", id: "glasses" },   // the hardware, quietly
  { kind: "beat", id: "thesis", terminal: true },
];

function CloseStage({ p, tl }: StageProps) {
  const reduced = useReducedMotion();
  const wideScale = useTransform(p, [0, 1], [1.1, 1.02]);
  // HUD dissolves away entirely — the technology gets out of the way.
  const hud = useTransform(p, [0, 0.18], [0.5, 0]);

  const present = useBeat({ p, tl }, "present");
  const eyes = useBeat({ p, tl }, "eyes");
  const glassesB = useBeat({ p, tl }, "glasses");
  const thesis = useBeat({ p, tl }, "thesis");

  // Each scrim rides the beat it protects, so text over photography is never
  // fully opaque against a bright frame.
  const scrimA = useTransform(present.opacity, [0, 1], [0.15, 0.62]);
  const scrimB = useTransform(eyes.opacity, [0, 1], [0, 0.55]);
  const scrimC = useTransform(thesis.opacity, [0, 1], [0, 0.68]);
  const glassesOpacity = useTransform(glassesB.opacity, [0, 1], [0, 0.9]);

  return (
    <>
      <Plate
        plate={CONSULT_WARM}
        alt="The physician and patient in conversation, eye to eye, with no screen between them"
        style={reduced ? undefined : { scale: wideScale, willChange: "transform" }}
      />
      <motion.div aria-hidden style={reduced ? { opacity: 0.5 } : { opacity: scrimA }} className="absolute inset-0 z-[22] bg-[#050d10]" />
      <motion.div aria-hidden style={reduced ? undefined : { opacity: scrimB }} className="film-abs-only absolute inset-0 z-[23] bg-[#050d10]" />
      <motion.div aria-hidden style={reduced ? undefined : { opacity: scrimC }} className="film-abs-only absolute inset-0 z-[24] bg-[#050d10]" />
      <HudFrame opacity={reduced ? 0 : hud} tint={0.05} />
      <Vignette strength={0.7} />

      {/* the hardware, revealed quietly near the end */}
      <Plate
        plate={GLASSES_HERO}
        alt=""
        className="film-abs-only"
        style={reduced ? { display: "none" } : { opacity: glassesOpacity }}
      />

      <SafeLayer>
        <Beat p={p} tl={tl} id="present" layer="stack" y={10}>
          <p className="max-w-2xl text-2xl font-light leading-snug text-white sm:text-4xl">
            He never stopped looking at his patient.
          </p>
        </Beat>

        <Beat p={p} tl={tl} id="eyes" layer="stack" y={10}>
          <p className="max-w-2xl text-2xl font-light leading-snug text-white sm:text-4xl">
            A second set of eyes.
            <span className="block text-white/70">
              Without taking yours off the patient.
            </span>
          </p>
        </Beat>

        <Beat p={p} tl={tl} id="glasses" layer="stack" y={10}>
          <p className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            WiserDoc
          </p>
        </Beat>

        <Beat p={p} tl={tl} id="thesis" layer="stack" y={10}>
          <div className="max-w-3xl">
            <p className="text-2xl font-semibold leading-snug text-white sm:text-5xl">
              The doctor stays present with the patient.
            </p>
            <p className="mt-4 text-xl font-light leading-snug text-hud sm:text-3xl">
              WiserDoc handles the cognitive background work.
            </p>
          </div>
        </Beat>
      </SafeLayer>
    </>
  );
}

/* ── what you just watched ────────────────────────────────────────────── */

const LAYERS: [string, string][] = [
  ["Listens", "Ambient capture of the encounter — no typing, no dictation, no screen between you."],
  ["Understands", "Speech becomes structured clinical context, not just a transcript."],
  ["Retrieves", "Findings query a curated emergency-medicine index and this patient's chart."],
  ["Assists", "Quiet cues when something is unestablished — and confirmation when it isn't."],
  ["Organizes", "The encounter arrives as a summary, documentation and codes, ready for review."],
];

function LayersSection() {
  return (
    <section id="ch-organize" className="section-spacing relative bg-[#050b0e] py-24 sm:py-32">
      <div className="mx-auto w-[min(94vw,920px)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <Micro className="text-hud">What you just watched</Micro>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-5xl">
            Not transcription.
            <span className="block text-white/60">
              A real-time clinical intelligence layer.
            </span>
          </h2>
        </motion.div>

        <div className="mt-10 grid gap-2.5">
          {LAYERS.map(([k, v], i) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="grid gap-1 rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 sm:grid-cols-[170px_1fr] sm:items-baseline sm:gap-6 sm:px-7 sm:py-5"
            >
              <span className="font-mono text-sm uppercase tracking-[0.18em] text-hud">{k}</span>
              <span className="text-[15px] leading-relaxed text-white/80">{v}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── investors ────────────────────────────────────────────────────────── */

function InvestorBand() {
  return (
    <section
      id="investors"
      className="section-spacing relative border-y border-white/[0.07] bg-[#070f12] py-20 sm:py-28"
    >
      <div className="mx-auto w-[min(94vw,820px)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <Micro className="text-hud">For investors</Micro>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold leading-snug text-white sm:text-4xl">
            AI that helps physicians stay present, while clinical intelligence
            runs quietly in the background.
          </h2>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <Micro className="text-white/70">Technical credibility</Micro>
              <p className="mt-2 text-[15px] leading-relaxed text-white/85">
                32,978 indexed clinical passages powering hybrid retrieval —
                keyword and vector search combined — in the current EM Copilot
                prototype.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <Micro className="text-white/70">Current scope</Micro>
              <p className="mt-2 text-[15px] leading-relaxed text-white/85">
                A limited clinical trial with allowlisted physicians, using
                synthetic and de-identified cases. Decision support only, with
                the physician reviewing everything.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="mailto:aistethxyz@gmail.com?subject=WiserDoc%20investor%20deck"
              className="rounded-xl bg-hud px-6 py-3 text-sm font-semibold text-[#04140c] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud"
            >
              Request the deck
            </a>
            <a
              href="mailto:aistethxyz@gmail.com?subject=EM%20Copilot%20trial%20access"
              className="rounded-xl border border-white/25 px-6 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud"
            >
              Request trial access
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── close ────────────────────────────────────────────────────────────── */

function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#070f12] py-24 text-center sm:py-32">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(74,222,158,0.13) 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto w-[min(94vw,700px)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-semibold leading-tight text-white sm:text-5xl">
            Bring a second set of eyes
            <span className="block">to every encounter.</span>
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/app/login?redirect=/em-copilot"
              className="rounded-xl bg-hud px-7 py-3.5 text-sm font-semibold text-[#04140c] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud"
            >
              Sign in to WiserDoc
            </a>
            <a
              href="mailto:aistethxyz@gmail.com?subject=EM%20Copilot%20trial%20access"
              className="rounded-xl border border-white/25 px-7 py-3.5 text-sm font-medium text-white/90 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud"
            >
              Request trial access
            </a>
          </div>
          <p className="mx-auto mt-10 max-w-lg text-xs leading-relaxed text-white/70">
            Decision support only — the physician retains full clinical judgment.
            EM Copilot is in a limited trial using synthetic and de-identified
            cases, and is not a medical device.
          </p>
        </motion.div>
      </div>
      <footer className="relative mt-16 border-t border-white/[0.07] pt-8">
        <p className="text-xs text-white/55">
          © {new Date().getFullYear()} AISteth · WiserDoc · Toronto, Ontario
        </p>
      </footer>
    </section>
  );
}

/* ── act ──────────────────────────────────────────────────────────────── */

export function ActOutro() {
  return (
    <>
      <Scene spec={SUMMARY_SPEC}>{(s) => <SummaryStage {...s} />}</Scene>
      <Scene spec={CLOSE_SPEC}>{(s) => <CloseStage {...s} />}</Scene>
      <LayersSection />
      <InvestorBand />
      <CtaSection />
    </>
  );
}

export { SUMMARY_SPEC, CLOSE_SPEC };
