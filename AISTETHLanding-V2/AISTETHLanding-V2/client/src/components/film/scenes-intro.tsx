/**
 * Act I — the hero, and the move into the physician's field of view.
 *
 * The hero is fully composed at zero scroll: physician, patient, glasses, the
 * optical field and a live symptom readout are all present before the visitor
 * touches the wheel. Nothing here is baked into the photograph — the field and
 * every HUD element are SVG/DOM, so they stay crisp and animatable.
 */
import { motion, useTransform, MotionValue, useReducedMotion } from "framer-motion";
import type { BeatSpec } from "./clock";
import {
  Scene,
  SafeLayer,
  StageProps,
  Beat,
  useBeat,
  Plate,
  LivePlate,
  Vignette,
  TopScrim,
  Micro,
  Dot,
  GlassCard,
} from "./shared";
import { LensOptics, DrawnFrame } from "./lineart";
import { HERO_OTS, PATIENT_WARM, HERO_VIDEO } from "./images";

/* ── Scene 1 · hero ───────────────────────────────────────────────────── */

const HERO_SPEC: readonly BeatSpec[] = [
  { kind: "lead", vh: 30 },              // hold the composed frame
  { kind: "beat", id: "line1" },         // "Every consultation is a stream…"
  { kind: "beat", id: "line2" },         // "Most of it disappears…"
  { kind: "beat", id: "states", terminal: true },
];

const STATES = ["Listening", "Understanding", "Retrieving", "Assisting"];

/**
 * The optical field: a soft cone leaving the glasses, plus the readout that
 * lives inside it. Deliberately *not* aimed at the patient as a projection —
 * it fans across the physician's own field of view. The patient sees a
 * clinician looking at them; the field is ours to see, not theirs.
 */
function OpticalField({ opacity }: { opacity?: MotionValue<number> }) {
  return (
    <motion.div
      aria-hidden
      style={opacity ? { opacity } : undefined}
      className="pointer-events-none absolute inset-0 z-[22]"
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="field-breathe absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="cone" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4ade9e" stopOpacity="0.20" />
            <stop offset="45%" stopColor="#4ade9e" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#4ade9e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* origin sits at the glasses in the lower-left foreground */}
        <path d="M20,62 L100,16 L100,74 Z" fill="url(#cone)" />
        <path d="M20,62 L100,26" stroke="#4ade9e" strokeOpacity="0.16" strokeWidth="0.25" />
        <path d="M20,62 L100,58" stroke="#4ade9e" strokeOpacity="0.10" strokeWidth="0.25" />
      </svg>
    </motion.div>
  );
}

function HeroStage({ p, tl }: StageProps) {
  const reduced = useReducedMotion();
  // Very slow push — depth without motion sickness.
  const imgScale = useTransform(p, [0, 1], [1.04, 1.12]);
  const fieldFade = useTransform(p, [0, 0.7], [1, 0.25]);
  const chrome = useTransform(p, [0, 0.22], [1, 0]);
  const line1 = useBeat({ p, tl }, "line1");
  const line2 = useBeat({ p, tl }, "line2");

  return (
    <>
      <LivePlate
        plate={HERO_OTS}
        video={HERO_VIDEO}
        alt="A physician wearing smart glasses listening to a relaxed patient across a consulting desk"
        priority
        style={reduced ? undefined : { scale: imgScale, willChange: "transform" }}
      />
      {/* Warm the shadows rather than crushing them to cold black. */}
      <div
        aria-hidden
        className="absolute inset-0 z-[21]"
        style={{
          background:
            "linear-gradient(105deg, rgba(5,13,16,0.86) 0%, rgba(5,13,16,0.55) 38%, rgba(5,13,16,0.15) 62%, rgba(5,13,16,0.5) 100%)",
        }}
      />
      <OpticalField opacity={reduced ? undefined : fieldFade} />
      <Vignette strength={0.6} />

      <SafeLayer>
        <div className="relative flex h-full flex-col justify-center px-[6vw] sm:px-[8vw]">
          {/* live readout, sitting inside the optical field */}
          <motion.div
            style={reduced ? undefined : { opacity: fieldFade }}
            className="film-abs-only absolute right-[6vw] top-[14%] hidden w-[min(34vw,320px)] lg:block"
          >
            <GlassCard label={<><Dot /> <span className="ml-1.5">Listening</span></>} blur>
              <p className="font-mono text-[13px] leading-relaxed text-white/85">
                “…pressure in my chest since yesterday evening…”
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-hud/40 bg-hud/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-hud">
                  chest pressure
                </span>
                <span className="rounded-full border border-hud/40 bg-hud/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-hud">
                  onset · yesterday
                </span>
              </div>
            </GlassCard>
          </motion.div>

          <div className="relative z-30 max-w-xl">
            <Micro className="text-hud">WiserDoc · EM Copilot</Micro>
            <h1 className="mt-4 text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
              A second set of eyes.
              <span className="block text-white/70">
                Without taking yours off the patient.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/75 sm:text-lg">
              Real-time clinical intelligence delivered in the physician&rsquo;s
              field of view.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="mailto:aistethxyz@gmail.com?subject=EM%20Copilot%20trial%20access"
                className="rounded-xl bg-hud px-6 py-3 text-sm font-semibold text-[#04140c] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud"
              >
                Request trial access
              </a>
              <a
                href="#investors"
                className="rounded-xl border border-white/25 px-6 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud"
              >
                For investors
              </a>
            </div>

            {/* the product in four words, always visible */}
            <motion.div
              style={reduced ? undefined : { opacity: chrome }}
              className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1"
            >
              {STATES.map((s, i) => (
                <span key={s} className="flex items-center gap-2">
                  {i > 0 && <span className="text-white/30">→</span>}
                  <Micro className={i === 0 ? "text-hud" : "text-white/55"}>{s}</Micro>
                </span>
              ))}
            </motion.div>
          </div>
        </div>

        {/* narrative beats, layered over the consultation rather than on black */}
        <Beat p={p} tl={tl} id="line1" layer="stack" y={12}>
          <p className="max-w-2xl text-xl font-light leading-snug text-white sm:text-3xl">
            Every consultation is a stream of clinical information.
          </p>
        </Beat>
        <Beat p={p} tl={tl} id="line2" layer="stack" y={12}>
          <p className="max-w-2xl text-xl font-light leading-snug text-white sm:text-3xl">
            Most of it disappears the moment it&rsquo;s spoken.
          </p>
        </Beat>
        <Beat p={p} tl={tl} id="states" layer="stack" y={12}>
          <p className="max-w-2xl text-xl font-light leading-snug text-white sm:text-3xl">
            Unless something is listening with you.
          </p>
        </Beat>

        {/* scrims ride the beats they protect, so they can never fall out of phase */}
        <div className="film-abs-only">
          <motion.div
            aria-hidden
            style={{ opacity: line1.opacity }}
            className="pointer-events-none absolute inset-0 z-[24] bg-[#050d10]/70"
          />
          <motion.div
            aria-hidden
            style={{ opacity: line2.opacity }}
            className="pointer-events-none absolute inset-0 z-[24] bg-[#050d10]/70"
          />
        </div>

        <motion.div
          style={reduced ? undefined : { opacity: chrome }}
          className="film-abs-only absolute bottom-[4vh] left-1/2 z-30 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <Micro className="text-white/60">Scroll</Micro>
          <motion.span
            animate={reduced ? undefined : { y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="block h-6 w-px bg-gradient-to-b from-white/60 to-transparent"
          />
        </motion.div>
      </SafeLayer>
    </>
  );
}

/* ── Scene 2 · into the physician's field of view ─────────────────────── */

const POV_SPEC: readonly BeatSpec[] = [
  { kind: "lead", vh: 4 },
  { kind: "beat", id: "caption" },
  { kind: "tick", id: "boot", count: 5 },
  { kind: "beat", id: "ready", terminal: true },
];

// 32,978 is the real chunk count of the EM Copilot index (BM25 + vector).
// Sources are described by category, not title — the reference texts are licensed.
const BOOT_LINES: [string, string][] = [
  ["MIC ARRAY", "online"],
  ["SPEECH MODEL", "ready"],
  ["RAG INDEX · 32,978 PASSAGES", "loaded"],
  ["SOURCES · EM TEXTS + ALGORITHMS", "indexed"],
  ["MODE", "ambient listening"],
];

function PovStage({ p, tl }: StageProps) {
  const reduced = useReducedMotion();
  /* The crossing, in four overlapping movements:
     1. the over-the-shoulder plate pushes toward camera and defocuses
     2. the lens optics draw themselves, then expand past the viewer
     3. the patient resolves out of that blur — we are now behind the glasses
     4. the drawn HUD frame settles in
     Each is a pure function of p, so the whole crossing scrubs and reverses. */
  const otsOpacity = useTransform(p, [0, 0.28], [1, 0]);
  const otsScale = useTransform(p, [0, 0.34], [1.1, 1.55]);
  const otsBlurV = useTransform(p, [0, 0.28], [0, 9]);
  const otsBlur = useTransform(otsBlurV, (v) => `blur(${v.toFixed(1)}px)`);

  const lensDraw = useTransform(p, [0.02, 0.22], [0, 1]);
  const lensExpand = useTransform(p, [0.18, 0.46], [1, 3.4]);
  const lensOpacity = useTransform(p, [0.02, 0.16, 0.34, 0.46], [0, 1, 1, 0]);

  const povOpacity = useTransform(p, [0.18, 0.38], [0, 1]);
  const povScale = useTransform(p, [0.18, 1], [1.16, 1.02]);
  const povBlurV = useTransform(p, [0.18, 0.40], [12, 0]);
  const povBlur = useTransform(povBlurV, (v) => `blur(${v.toFixed(1)}px)`);

  const frameDraw = useTransform(p, [0.36, 0.52], [0, 1]);
  const caption = useBeat({ p, tl }, "caption");

  return (
    <>
      {/* patient resolving into focus as we cross into the physician's view */}
      <Plate
        plate={PATIENT_WARM}
        alt="The patient, seen from the physician's point of view, talking calmly"
        priority
        style={
          reduced
            ? undefined
            : { opacity: povOpacity, scale: povScale, filter: povBlur, willChange: "transform" }
        }
      />
      {/* the over-the-shoulder plate we came from, pushing past the camera */}
      <Plate
        plate={HERO_OTS}
        alt=""
        priority
        className="film-abs-only"
        style={
          reduced
            ? { display: "none" }
            : { opacity: otsOpacity, scale: otsScale, filter: otsBlur, willChange: "transform" }
        }
      />
      {/* the optics themselves — drawn, then passing over the viewer */}
      {!reduced && (
        <div className="film-abs-only absolute inset-0 z-[23]">
          <LensOptics draw={lensDraw} expand={lensExpand} opacity={lensOpacity} />
        </div>
      )}
      <div aria-hidden className="absolute inset-0 z-[21] bg-[#050d10]/45" />
      <DrawnFrame t={frameDraw} tint={0.05} />
      <Vignette strength={0.7} />
      <TopScrim on={caption.opacity} />

      <SafeLayer>
        <Beat p={p} tl={tl} id="caption" layer="stack" y={10} className="!items-start pt-[12vh]">
          <div>
            <p className="text-xl font-light leading-snug text-white sm:text-3xl">
              This is what your physician sees.
            </p>
            <Micro className="mt-3 block text-white/70">
              His view has not changed at all
            </Micro>
          </div>
        </Beat>

        {/* System readout lives in a panel. Loose mono text floating on
            photography is unreadable the moment the image behind it is busy. */}
        <div className="absolute bottom-[10vh] left-[6vw] z-30 w-[min(86vw,440px)] rounded-xl border border-hud/25 bg-[#050d10]/85 px-4 py-3.5 backdrop-blur-sm">
          <div className="mb-2.5 flex items-center gap-2 border-b border-white/10 pb-2">
            <Dot />
            <Micro className="text-hud">System</Micro>
          </div>
          <div className="flex flex-col gap-1.5">
            {BOOT_LINES.map(([k, v], i) => (
              <BootLine key={k} p={p} tl={tl} i={i} k={k} v={v} />
            ))}
          </div>
        </div>

        <Beat
          p={p}
          tl={tl}
          id="ready"
          className="film-abs-only absolute right-[6vw] top-[8vh] z-30"
          x={16}
        >
          <span className="flex items-center gap-2 rounded-full border border-hud/40 bg-[#050d10]/70 px-3.5 py-1.5">
            <Dot />
            <Micro className="text-hud">Listening</Micro>
          </span>
        </Beat>
      </SafeLayer>
    </>
  );
}

function BootLine({
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
  const r = tl.sub("boot", i);
  const opacity = useTransform(p, r.enter, [0, 1]);
  const x = useTransform(p, r.enter, [-10, 0]);
  return (
    <motion.div
      style={reduced ? undefined : { opacity, x }}
      className="flex items-baseline justify-between gap-3"
    >
      <Micro className="text-white/70">{k}</Micro>
      <Micro className="shrink-0 text-hud">{v}</Micro>
    </motion.div>
  );
}

/* ── act ──────────────────────────────────────────────────────────────── */

export function ActIntro() {
  return (
    <>
      <Scene spec={HERO_SPEC}>{(s) => <HeroStage {...s} />}</Scene>
      <Scene spec={POV_SPEC} id="ch-listen">{(s) => <PovStage {...s} />}</Scene>
    </>
  );
}

export { HERO_SPEC, POV_SPEC };
