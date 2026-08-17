/**
 * The film's clock.
 *
 * Every scene declares *what happens* as an ordered list of beats. Heights and
 * animation ranges are derived from that list, never hand-tuned. Two properties
 * follow, and they are the whole point:
 *
 *   1. Every scene advances at the same rate — one beat costs the same amount of
 *      scroll everywhere, so there are no gear changes at scene boundaries.
 *   2. Dead scroll is impossible. A scene's travel *is* the sum of its beats, so
 *      there is no leftover span where the wheel turns and nothing happens.
 *
 * Scroll position is the source of truth: no springs, no easing over time. Stop
 * anywhere and the frame holds exactly where you left it; scroll back and it
 * reverses. Everything here is a pure function of scroll offset.
 */

/* ── constants (vh) ───────────────────────────────────────────────────── */

/** A story beat: enters, holds at full opacity, exits. */
export const BEAT_VH = 36;
/** A cumulative item (summary row, chip, boot line) — appears and stays. */
export const TICK_VH = 14;
/** One transcribed word. Same in every transcript. */
export const WORD_VH = 4;
/** Dwell before a scene's first beat fires, so an entrance can land. */
export const LEAD_VH = 16;
/** A terminal beat: enters, then holds to the end of the scene and through the wipe. */
export const TERM_HOLD_VH = 24;

/** Fractions of BEAT_VH spent entering / holding / exiting. */
const ENTER = 0.2;
const HOLD = 0.6;

/** Minimum full-opacity plateau we consider readable. Asserted in dev. */
export const MIN_HOLD_VH = 20;

/* ── spec ─────────────────────────────────────────────────────────────── */

export type BeatSpec =
  /** Empty dwell — a held frame, a camera move with no text. */
  | { kind: "lead"; id?: string; vh?: number }
  /** A text/story beat with a guaranteed readable plateau. */
  | { kind: "beat"; id: string; vh?: number; terminal?: boolean }
  /** A group of cumulative items revealed in sequence. */
  | { kind: "tick"; id: string; count: number; vh?: number }
  /** Word-by-word transcription. */
  | { kind: "words"; id: string; count: number; vh?: number };

export type BeatRange = {
  /** [in0, in1, out0, out1] — for useTransform(p, fade, [0, 1, 1, 0]). */
  fade: [number, number, number, number];
  /** [in0, in1] — one-way reveal, for cumulative elements. */
  enter: [number, number];
  /** Scene-progress bounds of the whole beat. */
  start: number;
  end: number;
  /** Full-opacity plateau in vh — surfaced so dev assertions can check it. */
  holdVh: number;
};

export type Timeline = {
  heightVh: number;
  travelVh: number;
  /** Range for a declared beat. Throws in dev on an unknown id. */
  range: (id: string) => BeatRange;
  /** Range for item i of n inside a tick/words group. */
  sub: (id: string, i: number, n?: number) => BeatRange;
};

/* ── sizing ───────────────────────────────────────────────────────────── */

function spanVh(s: BeatSpec): number {
  if (s.vh != null) return s.vh;
  switch (s.kind) {
    case "lead":
      return LEAD_VH;
    case "beat":
      return s.terminal ? BEAT_VH * ENTER + TERM_HOLD_VH : BEAT_VH;
    case "tick":
      return TICK_VH * s.count;
    case "words":
      return WORD_VH * s.count;
  }
}

export function travelVh(spec: readonly BeatSpec[]): number {
  return spec.reduce((sum, s) => sum + spanVh(s), 0);
}

export function heightVh(spec: readonly BeatSpec[]): number {
  return 100 + travelVh(spec);
}

/* ── timeline ─────────────────────────────────────────────────────────── */

/**
 * Pure builder — no hooks, so it can run at module scope for chapter offsets
 * as well as inside a component.
 */
export function buildTimeline(spec: readonly BeatSpec[]): Timeline {
  const travel = travelVh(spec);
  const height = 100 + travel;
  // Guard against a spec of only zero-length entries.
  const toP = (vh: number) => (travel > 0 ? vh / travel : 0);

  const ranges = new Map<string, BeatRange>();
  const groups = new Map<string, { start: number; span: number; count: number }>();

  let cursor = 0;
  for (const s of spec) {
    const span = spanVh(s);
    const start = cursor;
    cursor += span;

    if (s.kind === "lead") {
      if (s.id) {
        ranges.set(s.id, {
          fade: [toP(start), toP(start), toP(cursor), toP(cursor)],
          enter: [toP(start), toP(start)],
          start: toP(start),
          end: toP(cursor),
          holdVh: span,
        });
      }
      continue;
    }

    if (s.kind === "beat") {
      const enterVh = BEAT_VH * ENTER;
      const in0 = start;
      const in1 = start + enterVh;
      // A terminal beat never fades: it holds to p=1 and rides the sticky wipe.
      const out0 = s.terminal ? travel : start + enterVh + BEAT_VH * HOLD;
      const out1 = s.terminal ? travel : cursor;
      ranges.set(s.id, {
        fade: [toP(in0), toP(in1), toP(out0), toP(out1)],
        enter: [toP(in0), toP(in1)],
        start: toP(in0),
        end: toP(out1),
        holdVh: out0 - in1,
      });
      continue;
    }

    // tick / words — cumulative groups
    groups.set(s.id, { start, span, count: s.count });
    const itemVh = s.kind === "tick" ? TICK_VH : WORD_VH;
    ranges.set(s.id, {
      fade: [toP(start), toP(start + itemVh), toP(travel), toP(travel)],
      enter: [toP(start), toP(start + itemVh)],
      start: toP(start),
      end: toP(cursor),
      // Cumulative items persist to the end of the scene once revealed.
      holdVh: travel - (start + itemVh),
    });
  }

  const range = (id: string): BeatRange => {
    const r = ranges.get(id);
    if (!r) {
      if (import.meta.env.DEV) {
        throw new Error(
          `[film clock] unknown beat "${id}". Declared: ${Array.from(ranges.keys()).join(", ")}`,
        );
      }
      return { fade: [0, 0, 1, 1], enter: [0, 0], start: 0, end: 1, holdVh: 0 };
    }
    return r;
  };

  const sub = (id: string, i: number, n?: number): BeatRange => {
    const g = groups.get(id);
    if (!g) return range(id);
    const count = n ?? g.count;
    const itemVh = g.span / Math.max(count, 1);
    // Overlap each item's entrance with the next so the cascade reads as one move.
    const enterVh = itemVh * 1.4;
    const s0 = g.start + i * itemVh;
    return {
      fade: [toP(s0), toP(s0 + enterVh), toP(travel), toP(travel)],
      enter: [toP(s0), toP(s0 + enterVh)],
      start: toP(s0),
      end: toP(travel),
      holdVh: travel - (s0 + enterVh),
    };
  };

  if (import.meta.env.DEV) assertReadable(spec, ranges, travel);

  return { heightVh: height, travelVh: travel, range, sub };
}

/* ── dev assertions ───────────────────────────────────────────────────── */

function assertReadable(
  spec: readonly BeatSpec[],
  ranges: Map<string, BeatRange>,
  travel: number,
) {
  if (travel <= 0) {
    console.error("[film clock] scene has zero travel — nothing will animate.");
    return;
  }
  for (const s of spec) {
    if (s.kind !== "beat") continue;
    const r = ranges.get(s.id);
    if (r && r.holdVh < MIN_HOLD_VH) {
      console.error(
        `[film clock] beat "${s.id}" holds at full opacity for only ${r.holdVh.toFixed(
          1,
        )}vh (minimum ${MIN_HOLD_VH}vh). Copy this short is unreadable at speed.`,
      );
    }
  }
  const last = [...spec].reverse().find((s) => s.kind === "beat") as
    | Extract<BeatSpec, { kind: "beat" }>
    | undefined;
  if (last && !last.terminal) {
    console.warn(
      `[film clock] scene's last beat "${last.id}" is not terminal — it will fade out before the scene releases.`,
    );
  }
}

/* ── chapters ─────────────────────────────────────────────────────────── */

export type Chapter = { n: string; label: string; id: string };

export const CHAPTERS: readonly Chapter[] = [
  { n: "01", label: "Listen", id: "ch-listen" },
  { n: "02", label: "Understand", id: "ch-understand" },
  { n: "03", label: "Retrieve", id: "ch-retrieve" },
  { n: "04", label: "Assist", id: "ch-assist" },
  { n: "05", label: "Organize", id: "ch-organize" },
];
