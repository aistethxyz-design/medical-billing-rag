/**
 * Act I — the opening title and the descent into the doctor's glasses.
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
} from "./shared";
import consultPov from "@/assets/consult-pov.png";

/* ── Scene 1 · opening titles ─────────────────────────────────────────── */

function OpeningStage({ p }: { p: MotionValue<number> }) {
  const line1 = useTransform(p, [0.02, 0.12, 0.22, 0.3], [0, 1, 1, 0]);
  const line2 = useTransform(p, [0.3, 0.4, 0.5, 0.58], [0, 1, 1, 0]);
  const title = useTransform(p, [0.6, 0.72, 0.94, 1], [0, 1, 1, 0]);
  const titleScale = useTransform(p, [0.6, 1], [0.96, 1.02]);
  const pulse = useTransform(p, [0.05, 0.55], [0, 1]);
  const pulseOpacity = useTransform(p, [0.05, 0.15, 0.5, 0.62], [0, 0.5, 0.5, 0]);
  const cue = useTransform(p, [0, 0.06], [1, 0]);

  return (
    <div className="flex h-full items-center justify-center bg-[#04090b]">
      <Grain />
      {/* faint ECG trace drawing itself */}
      <motion.svg
        aria-hidden
        viewBox="0 0 1200 120"
        className="absolute left-0 top-1/2 w-full -translate-y-1/2"
        style={{ opacity: pulseOpacity }}
      >
        <motion.path
          d="M0,60 H420 l14,-8 14,16 10,-44 14,72 12,-52 10,16 h80 l14,-8 14,16 10,-44 14,72 12,-52 10,16 H1200"
          fill="none"
          stroke="rgba(74,222,158,0.5)"
          strokeWidth="1.5"
          style={{ pathLength: pulse }}
        />
      </motion.svg>

      <motion.p
        style={{ opacity: line1 }}
        className="absolute px-6 text-center text-xl font-light text-white/85 sm:text-3xl"
      >
        Every consultation is a stream of clinical information.
      </motion.p>
      <motion.p
        style={{ opacity: line2 }}
        className="absolute px-6 text-center text-xl font-light text-white/85 sm:text-3xl"
      >
        Most of it disappears the moment it&rsquo;s spoken.
      </motion.p>

      <motion.div
        style={{ opacity: title, scale: titleScale }}
        className="absolute px-6 text-center"
      >
        <Micro className="text-hud/80">AISteth · EM Copilot</Micro>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Put on the glasses.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-white/60 sm:text-base">
          The next two minutes are seen through a physician&rsquo;s eyes —
          with a clinical intelligence layer running quietly behind them.
        </p>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        style={{ opacity: cue }}
        className="absolute bottom-8 flex flex-col items-center gap-2 text-white/50"
      >
        <Micro>Scroll to begin</Micro>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          className="block h-6 w-[1px] bg-gradient-to-b from-white/60 to-transparent"
        />
      </motion.div>
      <Vignette strength={0.9} />
    </div>
  );
}

/* ── Scene 2 · into the lens (HUD boot) ───────────────────────────────── */

const BOOT_LINES: [string, string][] = [
  ["MIC ARRAY", "online"],
  ["SPEECH MODEL", "ready"],
  ["RAG INDEX · 12,400 CLINICAL DOCUMENTS", "loaded"],
  ["MODE", "ambient listening"],
];

function GlassesStage({ p }: { p: MotionValue<number> }) {
  // slow dolly into the room
  const imgScale = useTransform(p, [0, 1], [1.18, 1.02]);
  const imgOpacity = useTransform(p, [0, 0.1], [0, 1]);
  const caption = useTransform(p, [0.08, 0.16, 0.3, 0.38], [0, 1, 1, 0]);
  const hud = useTransform(p, [0.38, 0.55], [0, 1]);
  const status = useTransform(p, [0.86, 0.95], [0, 1]);

  return (
    <div className="h-full bg-[#04090b]">
      <motion.img
        src={consultPov}
        alt="A patient across the desk, describing chest pressure"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ scale: imgScale, opacity: imgOpacity }}
      />
      <Vignette />
      <Grain />

      <motion.div
        style={{ opacity: caption }}
        className="absolute inset-x-0 top-[16vh] z-30 text-center"
      >
        <p className="px-6 text-lg font-light text-white/90 sm:text-2xl">
          This is your patient. You are the doctor.
        </p>
        <Micro className="mt-2 block text-white/50">
          Doctor&rsquo;s point of view · smart glasses on
        </Micro>
      </motion.div>

      <HudFrame opacity={hud} />

      {/* boot sequence */}
      <div className="absolute bottom-[10vh] left-[6vw] z-30 flex flex-col gap-2">
        {BOOT_LINES.map(([k, v], i) => {
          const a = 0.45 + i * 0.1;
          return (
            <BootLine key={k} p={p} at={[a, a + 0.07]} k={k} v={v} />
          );
        })}
      </div>

      <motion.div
        style={{ opacity: status }}
        className="absolute right-[6vw] top-[7vh] z-30 flex items-center gap-2 rounded-full border border-hud/30 bg-black/40 px-3 py-1.5 backdrop-blur-sm"
      >
        <Dot />
        <Micro className="text-hud">Listening</Micro>
      </motion.div>
    </div>
  );
}

function BootLine({
  p,
  at,
  k,
  v,
}: {
  p: MotionValue<number>;
  at: [number, number];
  k: string;
  v: string;
}) {
  const opacity = useTransform(p, at, [0, 1]);
  const x = useTransform(p, at, [-12, 0]);
  return (
    <MMicro style={{ opacity, x }} className="text-hud/80">
      {k} <span className="text-white/45">·······</span>{" "}
      <span className="text-white/90">{v}</span>
    </MMicro>
  );
}

/* ── exported act ─────────────────────────────────────────────────────── */

export function ActIntro() {
  return (
    <>
      <Scene height={220}>{(p) => <OpeningStage p={p} />}</Scene>
      <Scene height={260}>{(p) => <GlassesStage p={p} />}</Scene>
    </>
  );
}
