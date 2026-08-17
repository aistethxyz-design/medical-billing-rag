/**
 * Shared primitives for the cinematic scroll-film landing page.
 *
 * Every "scene" is a tall section with a sticky, viewport-height stage inside.
 * Scroll progress through the section (0 → 1) drives all animation via
 * framer-motion useScroll/useTransform, so the film plays forward AND backward
 * with the scrollbar — no timeline library needed.
 */
import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  MotionValue,
} from "framer-motion";

/* ── scene scaffolding ────────────────────────────────────────────────── */

export function useSceneProgress(ref: React.RefObject<HTMLElement>) {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  // Light smoothing so fast scrolls still feel filmic.
  return useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
}

/** Tall section + sticky full-screen stage. `height` in vh. */
export function Scene({
  height,
  children,
  className = "",
}: {
  height: number;
  children: (p: MotionValue<number>) => React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const p = useSceneProgress(ref);
  return (
    <section ref={ref} style={{ height: `${height}vh` }} className="relative">
      <div className={`sticky top-0 h-screen overflow-hidden ${className}`}>
        {children(p)}
      </div>
    </section>
  );
}

/** opacity/translate helper: fade in over [a,b], fade out over [c,d]. */
export function useFade(
  p: MotionValue<number>,
  a: number,
  b: number,
  c = 2,
  d = 3
) {
  return useTransform(p, [a, b, c, d], [0, 1, 1, 0]);
}

/* ── film grain + scanlines + vignette ────────────────────────────────── */

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

export function Grain({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-40 mix-blend-overlay"
      style={{ backgroundImage: NOISE, opacity }}
    />
  );
}

export function Vignette({ strength = 0.75 }: { strength?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-30"
      style={{
        background: `radial-gradient(ellipse 90% 80% at 50% 45%, transparent 45%, rgba(2,6,8,${strength}) 100%)`,
      }}
    />
  );
}

/* ── HUD chrome ───────────────────────────────────────────────────────── */

/** Corner brackets + tint that make any stage read as "inside the lens". */
export function HudFrame({
  opacity,
  tint = 0.14,
}: {
  opacity: MotionValue<number> | number;
  tint?: number;
}) {
  const corners = [
    "top-[4vh] left-[3vw] border-t-2 border-l-2 rounded-tl-md",
    "top-[4vh] right-[3vw] border-t-2 border-r-2 rounded-tr-md",
    "bottom-[4vh] left-[3vw] border-b-2 border-l-2 rounded-bl-md",
    "bottom-[4vh] right-[3vw] border-b-2 border-r-2 rounded-br-md",
  ];
  return (
    <motion.div
      aria-hidden
      style={{ opacity }}
      className="pointer-events-none absolute inset-0 z-20"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 120% 100% at 50% 50%, rgba(64,224,160,${tint}) 0%, rgba(64,224,160,${
            tint * 0.35
          }) 55%, rgba(4,12,10,0.5) 100%)`,
          mixBlendMode: "screen",
        }}
      />
      {corners.map((c, i) => (
        <div
          key={i}
          className={`absolute h-10 w-10 border-hud/70 sm:h-14 sm:w-14 ${c}`}
        />
      ))}
    </motion.div>
  );
}

/** Tiny monospace HUD label, e.g. "MIC ARRAY · ONLINE". */
export function Micro({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={style}
      className={`font-mono text-[10px] uppercase tracking-[0.28em] sm:text-[11px] ${className}`}
    >
      {children}
    </span>
  );
}

export function MMicro({
  children,
  className = "",
  ...rest
}: React.ComponentProps<typeof motion.span>) {
  return (
    <motion.span
      {...rest}
      className={`font-mono text-[10px] uppercase tracking-[0.28em] sm:text-[11px] ${className}`}
    >
      {children}
    </motion.span>
  );
}

/** Blinking status dot. */
export function Dot({ className = "bg-hud" }: { className?: string }) {
  return (
    <span className={`inline-block h-1.5 w-1.5 rounded-full ${className} animate-pulse`} />
  );
}

/* ── glass cards (AI cues) ────────────────────────────────────────────── */

export function GlassCard({
  label,
  labelClass = "text-hud",
  children,
  className = "",
  style,
}: {
  label: React.ReactNode;
  labelClass?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`hud-card rounded-xl border border-white/10 bg-[#0a1512]/70 p-4 backdrop-blur-md sm:p-5 ${className}`}
    >
      <Micro className={labelClass}>{label}</Micro>
      <div className="mt-2 text-sm leading-relaxed text-white/90 sm:text-[15px]">
        {children}
      </div>
    </div>
  );
}

/* ── word-by-word live transcription ──────────────────────────────────── */

export type Segment = {
  t: string;
  /** highlight group id — segments with hl get the AR highlight treatment */
  hl?: boolean;
};

function Word({
  word,
  p,
  at,
}: {
  word: string;
  p: MotionValue<number>;
  at: [number, number];
}) {
  const opacity = useTransform(p, at, [0, 1]);
  const y = useTransform(p, at, [6, 0]);
  return (
    <motion.span style={{ opacity, y }} className="inline-block whitespace-pre">
      {word}
    </motion.span>
  );
}

/**
 * Renders `segments` word-by-word across progress [start,end].
 * Highlighted segments light up as one contiguous phrase over [hlStart,hlEnd].
 * Standalone punctuation tokens are merged into the preceding word so commas
 * and periods never float.
 */
export function LiveWords({
  p,
  segments,
  start,
  end,
  hlStart = 2,
  hlEnd = 3,
  className = "",
}: {
  p: MotionValue<number>;
  segments: Segment[];
  start: number;
  end: number;
  hlStart?: number;
  hlEnd?: number;
  className?: string;
}) {
  const hlBg = useTransform(
    p,
    [hlStart, hlEnd],
    ["rgba(74,222,158,0)", "rgba(74,222,158,0.22)"]
  );
  const hlFg = useTransform(
    p,
    [hlStart, hlEnd],
    ["rgba(255,255,255,0.92)", "rgba(167,255,210,1)"]
  );

  type Tok = { w: string; g: number; hl: boolean };
  const toks: Tok[] = [];
  segments.forEach((s, g) => {
    for (const raw of s.t.split(" ").filter(Boolean)) {
      if (/^[,.;:!?)»%]+$/.test(raw) && toks.length) {
        const prev = toks[toks.length - 1];
        prev.w = prev.w.replace(/\s+$/, "") + raw + " ";
      } else {
        toks.push({ w: raw + " ", g, hl: !!s.hl });
      }
    }
  });

  const span = (end - start) / toks.length;
  const at = (i: number): [number, number] => [
    start + i * span,
    start + (i + 1) * span,
  ];

  // Group consecutive tokens of the same segment so a highlighted phrase is a
  // single span with one contiguous background.
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < toks.length) {
    const g = toks[i].g;
    const hl = toks[i].hl;
    const startIdx = i;
    const idxs: number[] = [];
    while (i < toks.length && toks[i].g === g) {
      idxs.push(i);
      i++;
    }
    const chunk = idxs.map((j, k) => (
      <Word
        key={j}
        // keep the phrase-final space OUTSIDE the highlight background
        word={hl && k === idxs.length - 1 ? toks[j].w.replace(/\s+$/, "") : toks[j].w}
        p={p}
        at={at(j)}
      />
    ));
    out.push(
      hl ? (
        <motion.span
          key={`g${startIdx}`}
          style={{ backgroundColor: hlBg, color: hlFg }}
          className="rounded-[3px] box-decoration-clone px-1 -mx-0.5"
        >
          {chunk}
        </motion.span>
      ) : (
        <span key={`g${startIdx}`}>{chunk}</span>
      )
    );
    if (hl) out.push(<span key={`s${startIdx}`}> </span>);
  }

  return <span className={className}>{out}</span>;
}

/* ── waveform ─────────────────────────────────────────────────────────── */

const BARS = [5, 9, 14, 8, 12, 16, 7, 11, 6, 13, 9, 5];

export function Waveform({
  opacity,
  className = "",
}: {
  opacity: MotionValue<number> | number;
  className?: string;
}) {
  return (
    <motion.div
      aria-hidden
      style={{ opacity }}
      className={`flex h-5 items-center gap-[3px] ${className}`}
    >
      {BARS.map((h, i) => (
        <span
          key={i}
          className="wf-bar w-[3px] rounded-full bg-hud/80"
          style={{ height: h, animationDelay: `${i * 0.09}s` }}
        />
      ))}
    </motion.div>
  );
}
