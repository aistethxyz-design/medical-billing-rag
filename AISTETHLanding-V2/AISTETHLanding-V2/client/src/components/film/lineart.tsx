/**
 * The AI layer, drawn.
 *
 * Art direction: the people, the clinic and the emotional beats stay
 * photographic and warm — that is real medicine. Everything the intelligence
 * does is rendered as luminous mint/cream line work on top: the optics of the
 * glasses, the HUD frame, retrieval, the links between a spoken phrase and the
 * cue that depends on it, and the collapse of a live encounter into structure.
 *
 * The contrast is the point. Nothing here is baked into a photograph, and
 * every stroke is a pure function of scroll progress, so it scrubs and reverses
 * with the rest of the film.
 */
import React from "react";
import { motion, useTransform, MotionValue, useReducedMotion } from "framer-motion";

/* ── shared defs ──────────────────────────────────────────────────────── */

const MINT = "#4ade9e";
const CREAM = "#f2e9d8";

/** One glow filter + gradients, mounted once per SVG that needs them. */
export function LineDefs({ id = "ln" }: { id?: string }) {
  return (
    <defs>
      <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="1.6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id={`${id}-glow-soft`} x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
      <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={MINT} stopOpacity="0.22" />
        <stop offset="50%" stopColor={MINT} stopOpacity="0.07" />
        <stop offset="100%" stopColor={MINT} stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/* ── a stroke that draws itself ───────────────────────────────────────── */

/**
 * A path whose length is bound to scroll: it draws on as `t` goes 0 → 1.
 * `t` is a MotionValue so the stroke scrubs and un-draws in reverse.
 */
export function DrawPath({
  d,
  t,
  stroke = MINT,
  width = 1,
  opacity = 0.8,
  glow = "ln",
  dash,
  className = "",
}: {
  d: string;
  t: MotionValue<number>;
  stroke?: string;
  width?: number;
  opacity?: number;
  glow?: string | null;
  dash?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash}
      opacity={opacity}
      filter={glow ? `url(#${glow}-glow)` : undefined}
      style={reduced ? undefined : { pathLength: t }}
      className={className}
      vectorEffect="non-scaling-stroke"
    />
  );
}

/** A small luminous node that pops in on `t`. */
export function Node({
  cx,
  cy,
  t,
  r = 2.2,
  fill = MINT,
  glow = "ln",
}: {
  cx: number;
  cy: number;
  t: MotionValue<number>;
  r?: number;
  fill?: string;
  glow?: string | null;
}) {
  const reduced = useReducedMotion();
  const scale = useTransform(t, [0, 1], [0, 1]);
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      filter={glow ? `url(#${glow}-glow)` : undefined}
      style={reduced ? undefined : { scale, opacity: t, transformOrigin: `${cx}px ${cy}px` }}
    />
  );
}

/* ── the optics of the glasses ────────────────────────────────────────── */

/**
 * The lens, drawn. Used twice: quietly over the hero, then blown up to fill
 * the frame as the camera crosses into the physician's point of view. Two
 * concentric lens outlines plus the light cone that leaves them.
 *
 * `draw` controls how much of the linework exists; `expand` scales the whole
 * assembly past the camera during the POV crossing.
 */
export function LensOptics({
  draw,
  expand,
  cone = true,
  opacity,
}: {
  draw: MotionValue<number>;
  expand?: MotionValue<number>;
  cone?: boolean;
  opacity?: MotionValue<number> | number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 200 120"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={reduced ? { opacity: 1 } : { opacity, scale: expand }}
    >
      <LineDefs />
      {cone && (
        <motion.path
          d="M42,74 L200,20 L200,104 Z"
          fill="url(#ln-cone)"
          style={reduced ? undefined : { opacity: draw }}
        />
      )}
      {/* lens outline — a rounded rectangle in the physician's sightline */}
      <DrawPath
        d="M58,36 Q100,28 142,36 Q150,60 142,84 Q100,92 58,84 Q50,60 58,36 Z"
        t={draw}
        width={1.1}
        opacity={0.85}
      />
      <DrawPath
        d="M64,42 Q100,35 136,42 Q143,60 136,78 Q100,85 64,78 Q57,60 64,42 Z"
        t={draw}
        stroke={CREAM}
        width={0.5}
        opacity={0.4}
      />
      {/* bridge + temple arm */}
      <DrawPath d="M142,58 L163,55" t={draw} width={0.9} opacity={0.7} />
      <DrawPath d="M58,58 L37,55" t={draw} width={0.9} opacity={0.7} />
      {/* scan sweep across the lens */}
      <DrawPath
        d="M62,66 L138,60"
        t={draw}
        stroke={CREAM}
        width={0.4}
        opacity={0.35}
        dash="2 3"
      />
    </motion.svg>
  );
}

/* ── retrieval constellation ──────────────────────────────────────────── */

const CONSTELLATION: { x: number; y: number }[] = [
  { x: 50, y: 50 },
  { x: 22, y: 26 },
  { x: 78, y: 22 },
  { x: 16, y: 66 },
  { x: 84, y: 62 },
  { x: 38, y: 82 },
  { x: 66, y: 84 },
];

/**
 * Retrieval, drawn: a query at the centre reaching out into the index and
 * pulling a handful of passages back. Deliberately sparse — this is a moment
 * of intelligence, not a database console.
 */
export function RetrievalWeb({ t, className = "" }: { t: MotionValue<number>; className?: string }) {
  const reduced = useReducedMotion();
  const centre = CONSTELLATION[0];
  const outer = CONSTELLATION.slice(1);
  // Each spoke draws slightly after the previous, so the reach reads outward.
  // CONSTELLATION is a module constant, so this hook count is fixed.
  const spokes = outer.map((_, i) =>
    useTransform(t, [i * 0.09, 0.4 + i * 0.09], [0, 1]),
  );
  const spoke = (i: number) => spokes[i];

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <LineDefs id="rw" />
      {outer.map((n, i) => (
        <DrawPath
          key={`l${i}`}
          d={`M${centre.x},${centre.y} Q${(centre.x + n.x) / 2 + (i % 2 ? 6 : -6)},${
            (centre.y + n.y) / 2
          } ${n.x},${n.y}`}
          t={spoke(i)}
          width={1.3}
          opacity={0.75}
          glow="rw"
        />
      ))}
      {outer.map((n, i) => (
        <Node key={`n${i}`} cx={n.x} cy={n.y} t={spoke(i)} r={1.5} glow="rw" />
      ))}
      <Node cx={centre.x} cy={centre.y} t={t} r={2.6} glow="rw" />
      {!reduced && (
        <motion.circle
          cx={centre.x}
          cy={centre.y}
          r={9}
          fill="none"
          stroke={MINT}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          opacity={0.5}
          filter="url(#rw-glow)"
          style={{ pathLength: t }}
        />
      )}
    </svg>
  );
}

/* ── provenance connector ─────────────────────────────────────────────── */

/**
 * A thin luminous line linking a finding to the thing that depends on it —
 * the phrase in the transcript to the cue it raised. Makes the interface read
 * as reasoned rather than decorative.
 */
export function Connector({
  t,
  from = { x: 18, y: 22 },
  to = { x: 74, y: 74 },
  className = "",
}: {
  t: MotionValue<number>;
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  className?: string;
}) {
  const midY = (from.y + to.y) / 2;
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <LineDefs id="cn" />
      <DrawPath
        d={`M${from.x},${from.y} C${from.x},${midY} ${to.x},${midY} ${to.x},${to.y}`}
        t={t}
        width={1.4}
        opacity={0.8}
        glow="cn"
        dash="1.5 2"
      />
      <Node cx={from.x} cy={from.y} t={t} r={0.9} glow="cn" />
      <Node cx={to.x} cy={to.y} t={t} r={0.9} glow="cn" />
    </svg>
  );
}

/* ── encounter collapse ───────────────────────────────────────────────── */

/**
 * The second signature moment: everything the copilot was holding converges
 * and reorganises. Lines run from scattered origins into an ordered column,
 * so the structure visibly *forms* out of the live encounter.
 */
export function CollapseWeb({ t, className = "" }: { t: MotionValue<number>; className?: string }) {
  const origins = [
    { x: 12, y: 18 },
    { x: 84, y: 12 },
    { x: 8, y: 52 },
    { x: 90, y: 46 },
    { x: 20, y: 86 },
    { x: 76, y: 88 },
  ];
  const target = { x: 50, y: 50 };
  // Fixed-length literal above, so this hook count is stable.
  const lanes = origins.map((_, i) => useTransform(t, [i * 0.06, 0.5 + i * 0.06], [0, 1]));
  const lane = (i: number) => lanes[i];

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <LineDefs id="cw" />
      {origins.map((o, i) => (
        <React.Fragment key={i}>
          <DrawPath
            d={`M${o.x},${o.y} Q${(o.x + target.x) / 2},${o.y} ${target.x},${target.y}`}
            t={lane(i)}
            stroke={i % 2 ? CREAM : MINT}
            width={1.2}
            opacity={0.6}
            glow="cw"
          />
          <Node cx={o.x} cy={o.y} t={lane(i)} r={1} fill={i % 2 ? CREAM : MINT} glow="cw" />
        </React.Fragment>
      ))}
    </svg>
  );
}

/* ── HUD frame, drawn ─────────────────────────────────────────────────── */

/** Corner brackets that draw themselves in rather than fading. */
export function DrawnFrame({ t, tint = 0.06 }: { t: MotionValue<number>; tint?: number }) {
  const reduced = useReducedMotion();
  const tintOpacity = useTransform(t, [0, 1], [0, tint]);
  if (reduced) return null;
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    >
      <LineDefs id="df" />
      <motion.rect
        x="0"
        y="0"
        width="100"
        height="100"
        fill={MINT}
        style={{ opacity: tintOpacity }}
      />
      <DrawPath d="M3,10 L3,3 L11,3" t={t} width={1.4} opacity={0.7} glow="df" />
      <DrawPath d="M89,3 L97,3 L97,10" t={t} width={1.4} opacity={0.7} glow="df" />
      <DrawPath d="M3,90 L3,97 L11,97" t={t} width={1.4} opacity={0.7} glow="df" />
      <DrawPath d="M89,97 L97,97 L97,90" t={t} width={1.4} opacity={0.7} glow="df" />
    </svg>
  );
}
