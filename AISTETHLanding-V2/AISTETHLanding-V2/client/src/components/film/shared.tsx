/**
 * Shared primitives for the cinematic scroll-film landing page.
 *
 * Each scene is a tall section containing a sticky, viewport-height stage.
 * Scroll progress through the section (0 → 1) drives every transform.
 *
 * There is deliberately NO spring on the primary scroll signal. A spring is a
 * low-pass filter, and lag is the mechanism by which it smooths — you cannot
 * have the smoothing without the lag. With one, beats keep firing after the
 * user stops and short beats never reach full opacity during a fling. Without
 * one, "is this text readable" becomes a question of scroll *position* rather
 * than scroll *speed*, which is a property we can actually guarantee (see
 * clock.ts). Browsers already smooth wheel input at the compositor.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  MotionValue,
} from "framer-motion";
import { BeatSpec, Timeline, buildTimeline } from "./clock";

/* ── scene scaffolding ────────────────────────────────────────────────── */

/** Raw, unfiltered scroll progress for a section. Position is the truth. */
export function useSceneProgress(ref: React.RefObject<HTMLElement>) {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  return scrollYProgress;
}

/**
 * Mounts children only when the section is near the viewport, so at most a
 * couple of stages composite at once instead of all seven. The margin is a
 * full viewport on each side, so nothing pops in during reverse scroll.
 */
function useNearViewport(ref: React.RefObject<HTMLElement>) {
  const [near, setNear] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => setNear(e.isIntersecting),
      { rootMargin: "100% 0px 100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return near;
}

export type StageProps = { p: MotionValue<number>; tl: Timeline; near: boolean };

/**
 * A scene. Declares its beats; height is derived from them.
 *
 * Under reduced motion the section unpins entirely and its stage renders as
 * normal document flow, so the page degrades to a readable long-form layout
 * rather than a broken pinned film.
 */
export function Scene({
  spec,
  id,
  children,
  className = "",
  exitFade = true,
}: {
  spec: readonly BeatSpec[];
  id?: string;
  children: (s: StageProps) => React.ReactNode;
  className?: string;
  /** Settle the imagery to the film's base before the stage wipes away. */
  exitFade?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const p = useSceneProgress(ref);
  const near = useNearViewport(ref);
  const reduced = useReducedMotion();
  // buildTimeline is pure; specs are module constants, so this is stable.
  const tl = React.useMemo(() => buildTimeline(spec), [spec]);
  // Sits above the photography but below the text layer (z-30), so a scene
  // resolves to its final words on a clean ground and the hand-off to the next
  // scene is a dark-to-dark wipe rather than a visible seam between two photos.
  const exit = useTransform(p, [0.95, 1], [0, 0.9]);

  if (reduced) {
    return (
      <section id={id} className="relative">
        <div className={`film-static ${className}`}>{children({ p, tl, near: true })}</div>
      </section>
    );
  }

  return (
    <section
      id={id}
      ref={ref}
      style={{ height: `${tl.heightVh}lvh` }}
      className="relative"
    >
      <div
        className={`film-stage sticky top-0 h-[100lvh] overflow-hidden [contain:layout_paint] ${className}`}
      >
        {/* Full-bleed layer: photography, vignette, grid — fills the large viewport. */}
        {/* UI layer is inset to the *visible* viewport so browser chrome never covers it. */}
        {children({ p, tl, near })}
        {exitFade && (
          <motion.div
            aria-hidden
            style={{ opacity: exit }}
            className="pointer-events-none absolute inset-0 z-[26] bg-[#070f12]"
          />
        )}
      </div>
    </section>
  );
}

/** Positions HUD/text against the visible viewport, clear of mobile browser chrome. */
export function SafeLayer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <div
      className={`absolute inset-x-0 top-0 h-[100dvh] pb-[env(safe-area-inset-bottom)] ${className}`}
    >
      {children}
    </div>
  );
}

/* ── beats ────────────────────────────────────────────────────────────── */

type BeatOpts = {
  y?: number;
  x?: number;
  scale?: [number, number];
  blur?: number;
  oneWay?: boolean;
};

/**
 * MotionValues for one declared beat. Returns constants under reduced motion so
 * every beat is simply present.
 */
export function useBeat(
  { p, tl }: Pick<StageProps, "p" | "tl">,
  id: string,
  opts: BeatOpts = {},
) {
  const reduced = useReducedMotion();
  const r = tl.range(id);
  const { y = 0, x = 0, scale, blur = 0, oneWay = false } = opts;

  // Under reduced motion every beat is simply present: the ranges collapse to
  // constants so the hooks stay unconditional and the values stay MotionValues.
  const flat: [number, number] = [0, 1];
  const opacity = useTransform(
    p,
    reduced ? flat : oneWay ? r.enter : r.fade,
    reduced ? [1, 1] : oneWay ? [0, 1] : [0, 1, 1, 0],
  );
  const ty = useTransform(p, reduced ? flat : r.enter, reduced ? [0, 0] : [y, 0]);
  const tx = useTransform(p, reduced ? flat : r.enter, reduced ? [0, 0] : [x, 0]);
  const sc = useTransform(p, reduced ? flat : r.enter, reduced ? [1, 1] : scale ?? [1, 1]);
  const fl = useTransform(p, reduced ? flat : r.enter, reduced ? [0, 0] : [blur, 0]);
  const filter = useTransform(fl, (v) => (v > 0.05 ? `blur(${v.toFixed(2)}px)` : "none"));

  return { opacity, y: ty, x: tx, scale: sc, filter, range: r, reduced };
}

/**
 * Renders a beat. `layer="stack"` centres it absolutely over the stage while
 * animating, and drops into normal flow under reduced motion.
 */
export function Beat({
  p,
  tl,
  id,
  layer = "flow",
  className = "",
  children,
  ...opts
}: {
  p: MotionValue<number>;
  tl: Timeline;
  id: string;
  layer?: "stack" | "flow";
  className?: string;
  children: React.ReactNode;
} & BeatOpts) {
  const reduced = useReducedMotion();
  const b = useBeat({ p, tl }, id, opts);

  if (reduced) {
    return <div className={`my-10 ${className}`}>{children}</div>;
  }

  const stack =
    layer === "stack"
      ? "absolute inset-0 z-30 grid place-items-center px-6 text-center pointer-events-none"
      : "";

  return (
    <motion.div
      style={{ opacity: b.opacity, y: b.y, x: b.x, scale: b.scale, filter: b.filter }}
      className={`${stack} ${className}`}
    >
      {layer === "stack" ? <div className="pointer-events-auto">{children}</div> : children}
    </motion.div>
  );
}

/* ── photography ──────────────────────────────────────────────────────── */

/**
 * A full-bleed plate. Responsive WebP; the scroll-driven `scale` gets an
 * explicit layer promotion so Blink doesn't re-rasterise a multi-megapixel
 * texture on every frame.
 */
export function Plate({
  plate,
  alt,
  style,
  priority = false,
  className = "",
}: {
  plate: { src: string; srcSet: string };
  alt: string;
  style?: React.ComponentProps<typeof motion.img>["style"];
  priority?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const common = {
    src: plate.src,
    srcSet: plate.srcSet,
    sizes: "100vw",
    alt,
    "aria-hidden": alt === "" ? true : undefined,
    decoding: "async" as const,
    loading: priority ? undefined : ("lazy" as const),
    ...(priority ? { fetchpriority: "high" } : {}),
  };
  // Static mode: a normal block image in the flow. Decorative plates drop out
  // entirely — without the film's layering they carry no meaning.
  if (reduced) {
    if (alt === "") return null;
    return (
      <img {...common} className="mb-6 w-full rounded-xl object-cover" />
    );
  }
  return (
    <motion.img
      {...common}
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
      style={style}
    />
  );
}

/* ── film grain, vignette, scrim ──────────────────────────────────────── */

export function Vignette({ strength = 0.75 }: { strength?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20"
      style={{
        background: `radial-gradient(ellipse 90% 80% at 50% 45%, transparent 45%, rgba(4,10,12,${strength}) 100%)`,
      }}
    />
  );
}

/**
 * Darkens the frame *in phase with the text it protects*. Pass the same opacity
 * MotionValue the copy uses, so a scrim can never be out of sync with its text.
 */
export function Scrim({
  on,
  from = 0.15,
  to = 0.7,
  className = "",
}: {
  on: MotionValue<number>;
  from?: number;
  to?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const opacity = useTransform(on, [0, 1], [from, to]);
  if (reduced) return null;
  return (
    <motion.div
      aria-hidden
      style={{ opacity }}
      className={`pointer-events-none absolute inset-0 z-[25] bg-[#050d10] ${className}`}
    />
  );
}

/** Top-anchored gradient scrim for captions over bright photography. */
export function TopScrim({ on }: { on: MotionValue<number> }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <motion.div
      aria-hidden
      style={{
        opacity: on,
        background:
          "linear-gradient(to bottom, rgba(4,10,12,0.85) 0%, rgba(4,10,12,0.5) 55%, transparent 100%)",
      }}
      className="pointer-events-none absolute inset-x-0 top-0 z-[25] h-[38vh]"
    />
  );
}

/* ── HUD chrome ───────────────────────────────────────────────────────── */

export function HudFrame({
  opacity,
  tint = 0.12,
}: {
  opacity: MotionValue<number> | number;
  tint?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return null;
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
          background: `radial-gradient(ellipse 120% 100% at 50% 50%, rgba(74,222,158,${tint}) 0%, rgba(74,222,158,${
            tint * 0.3
          }) 55%, rgba(5,13,16,0.45) 100%)`,
          mixBlendMode: "screen",
        }}
      />
      {corners.map((c, i) => (
        <div key={i} className={`absolute h-10 w-10 border-hud/70 sm:h-14 sm:w-14 ${c}`} />
      ))}
    </motion.div>
  );
}

/**
 * Small uppercase HUD label. Defaults to a contrast-safe colour so an unstyled
 * Micro can never fail WCAG by omission.
 */
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
      className={`font-mono text-[11px] uppercase tracking-[0.18em] text-white/60 sm:text-[12px] ${className}`}
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
      className={`font-mono text-[11px] uppercase tracking-[0.18em] text-white/60 sm:text-[12px] ${className}`}
    >
      {children}
    </motion.span>
  );
}

export function Dot({ className = "bg-hud" }: { className?: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${className} animate-pulse`} />;
}

/* ── glass cards ──────────────────────────────────────────────────────── */

export function GlassCard({
  label,
  labelClass = "text-hud",
  children,
  className = "",
  style,
  blur = false,
}: {
  label?: React.ReactNode;
  labelClass?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Only enable where the card actually sits over photography. */
  blur?: boolean;
}) {
  return (
    <div
      style={style}
      className={`hud-card rounded-xl border border-white/12 bg-[#0b1a16]/85 p-4 sm:p-5 ${
        blur ? "backdrop-blur-sm" : ""
      } ${className}`}
    >
      {label && <Micro className={labelClass}>{label}</Micro>}
      <div className={`${label ? "mt-2" : ""} text-sm leading-relaxed text-white/90 sm:text-[15px]`}>
        {children}
      </div>
    </div>
  );
}

/* ── word-by-word transcription ───────────────────────────────────────── */

export type Segment = {
  t: string;
  /** Highlighted phrases get the AR treatment and can be "lifted" into chips. */
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
  const y = useTransform(p, at, [5, 0]);
  return (
    <motion.span style={{ opacity, y }} className="inline-block whitespace-pre">
      {word}
    </motion.span>
  );
}

/**
 * Renders `segments` word-by-word across a declared `words` beat. Highlighted
 * segments light as one contiguous phrase. Standalone punctuation is merged
 * into the preceding word so commas never float.
 */
export function LiveWords({
  p,
  tl,
  id,
  segments,
  hlId,
  className = "",
}: {
  p: MotionValue<number>;
  tl: Timeline;
  id: string;
  segments: Segment[];
  /** Beat id whose entrance drives the highlight. Omit for no highlight. */
  hlId?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const hlRange = hlId ? tl.range(hlId).enter : ([2, 3] as [number, number]);
  const hlBg = useTransform(p, hlRange, ["rgba(74,222,158,0)", "rgba(74,222,158,0.22)"]);
  const hlFg = useTransform(p, hlRange, ["rgba(255,255,255,0.92)", "rgba(167,255,210,1)"]);

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

  const r = tl.range(id);
  const span = (r.end - r.start) / Math.max(toks.length, 1);
  const at = (i: number): [number, number] => [
    r.start + i * span,
    r.start + (i + 1) * span,
  ];

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
    const chunk = idxs.map((j, k) => {
      // Keep the phrase-final space outside the highlight background.
      const w = hl && k === idxs.length - 1 ? toks[j].w.replace(/\s+$/, "") : toks[j].w;
      return reduced ? (
        <span key={j} className="whitespace-pre">{w}</span>
      ) : (
        <Word key={j} word={w} p={p} at={at(j)} />
      );
    });
    out.push(
      hl ? (
        <motion.span
          key={`g${startIdx}`}
          style={reduced ? undefined : { backgroundColor: hlBg, color: hlFg }}
          className={`box-decoration-clone rounded-[3px] px-1 -mx-0.5 ${
            reduced ? "bg-hud/20 text-hud" : ""
          }`}
        >
          {chunk}
        </motion.span>
      ) : (
        <span key={`g${startIdx}`}>{chunk}</span>
      ),
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

/* ── provenance ───────────────────────────────────────────────────────── */

export type Provenance = "conversation" | "chart" | "knowledge";

export const PROV_STYLE: Record<Provenance, { label: string; cls: string; dot: string }> = {
  conversation: {
    label: "From conversation",
    cls: "border-hud/40 text-hud",
    dot: "bg-hud",
  },
  chart: {
    label: "From chart",
    cls: "border-sky-300/40 text-sky-200",
    dot: "bg-sky-300",
  },
  knowledge: {
    label: "From clinical knowledge",
    cls: "border-amber-300/40 text-amber-200",
    dot: "bg-amber-300",
  },
};

/** Small provenance tag — makes "where did this come from" legible at a glance. */
export function ProvTag({ kind, className = "" }: { kind: Provenance; className?: string }) {
  const s = PROV_STYLE[kind];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${s.cls} ${className}`}
    >
      <span className={`h-1 w-1 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
