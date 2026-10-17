/**
 * The HUD frame, drawn.
 *
 * Art direction: the people, the clinic and the emotional beats stay
 * photographic; the AI layer is carried by clean UI cards (transcript, cues,
 * references, summary). Decorative line work — lens optics, retrieval webs,
 * connectors, collapse lines — was removed because it read as noise rather
 * than product. Only the corner brackets that frame the physician's view
 * remain.
 *
 * Every stroke is a pure function of scroll progress, so it scrubs and
 * reverses with the rest of the film.
 */
import { motion, useTransform, MotionValue, useReducedMotion } from "framer-motion";

const MINT = "#4ade9e";

/** One glow filter, mounted once per SVG that needs it. */
function LineDefs({ id = "ln" }: { id?: string }) {
  return (
    <defs>
      <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="1.6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/**
 * A path whose length is bound to scroll: it draws on as `t` goes 0 → 1.
 * `t` is a MotionValue so the stroke scrubs and un-draws in reverse.
 */
function DrawPath({
  d,
  t,
  width = 1,
  opacity = 0.8,
  glow,
}: {
  d: string;
  t: MotionValue<number>;
  width?: number;
  opacity?: number;
  glow: string;
}) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={MINT}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      filter={`url(#${glow}-glow)`}
      style={{ pathLength: t }}
      vectorEffect="non-scaling-stroke"
    />
  );
}

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
