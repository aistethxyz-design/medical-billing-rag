/**
 * WiserDoc — the landing experience as a scroll-driven product film.
 *
 * Scroll position is the only source of truth: no scroll hijacking, no timed
 * playback, no spring on the primary signal. Stop and the frame holds; scroll
 * back and it reverses. The previous marketing page remains at /classic.
 */
import { useCallback, useEffect, useState } from "react";
import { motion, MotionConfig, useScroll, useSpring, useReducedMotion } from "framer-motion";
import { ActIntro } from "@/components/film/scenes-intro";
import { ActCopilot } from "@/components/film/scenes-copilot";
import { ActOutro } from "@/components/film/scenes-outro";
import { CHAPTERS } from "@/components/film/clock";

/** Long jumps are instant: smooth-scrolling 1,500vh would fast-forward the film. */
function useJump() {
  const reduced = useReducedMotion();
  return useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const far = Math.abs(el.getBoundingClientRect().top) > window.innerHeight * 2;
      el.scrollIntoView({
        behavior: reduced || far ? "auto" : "smooth",
        block: "start",
      });
    },
    [reduced],
  );
}

function FilmHeader() {
  const [past, setPast] = useState(false);
  const jump = useJump();

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.5);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      // `invisible` (not just opacity-0) so the links leave the tab order too.
      className={`fixed inset-x-0 top-0 z-50 transition-[opacity,visibility] duration-500 ${
        past ? "visible bg-[#070f12]/80 opacity-100 backdrop-blur-md" : "invisible opacity-0"
      }`}
    >
      <div className="mx-auto flex w-[min(94vw,1100px)] items-center justify-between px-4 py-3">
        <a
          href="/"
          className="flex items-center gap-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hud"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-hud text-[13px] font-bold text-[#04140c]">
            W
          </span>
          <span className="text-sm font-semibold tracking-wide text-white">WiserDoc</span>
        </a>
        <div className="flex items-center gap-2">
          <button
            onClick={() => jump("investors")}
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-white/80 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud"
          >
            For investors
          </button>
          <a
            href="/app/login?redirect=/em-copilot"
            className="rounded-lg border border-hud/40 bg-hud/10 px-4 py-1.5 text-[13px] font-medium text-hud transition hover:bg-hud/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud"
          >
            Sign in
          </a>
        </div>
      </div>
    </header>
  );
}

/** Progress rail doubling as a chapter navigator. */
function ChapterRail() {
  const { scrollYProgress } = useScroll();
  const reduced = useReducedMotion();
  // Decorative only — a trailing rail reads as intentional, unlike trailing content.
  const scaleX = useSpring(scrollYProgress, { stiffness: 400, damping: 40 });
  const [active, setActive] = useState(-1);
  const jump = useJump();
  // The rail navigates a film. Without the film it is just overlapping chrome.
  const hidden = reduced;

  useEffect(() => {
    const ids = CHAPTERS.map((c) => c.id);
    const onScroll = () => {
      let cur = -1;
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.5) cur = i;
      });
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.div
        aria-hidden
        style={{ scaleX: reduced ? scrollYProgress : scaleX }}
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-hud/80"
      />
      <nav
        aria-label="Chapters"
        className={`fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-2.5 ${
          hidden ? "" : "lg:flex"
        }`}
      >
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            onClick={() => jump(c.id)}
            aria-current={active === i ? "true" : undefined}
            className="group flex items-center justify-end gap-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hud"
          >
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.16em] transition ${
                active === i
                  ? "text-hud"
                  : active > i
                    ? "text-white/35 group-hover:text-white/70"
                    : "text-white/45 group-hover:text-white/80"
              }`}
            >
              {c.n} · {c.label}
            </span>
            <span
              className={`h-px transition-all ${
                active === i ? "w-6 bg-hud" : "w-3 bg-white/30 group-hover:w-5"
              }`}
            />
          </button>
        ))}
      </nav>
    </>
  );
}

const CinematicLanding = () => {
  const jump = useJump();

  useEffect(() => {
    document.title = "WiserDoc — clinical intelligence in your field of view";
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="film font-sans text-white antialiased">
        {/* first focusable control on the page */}
        <button
          onClick={() => jump("investors")}
          className="sr-only left-4 top-4 z-[70] rounded-lg bg-hud px-4 py-2 text-sm font-semibold text-[#04140c] focus:not-sr-only focus:fixed"
        >
          Skip the film — go to investor overview
        </button>

        <div aria-hidden className="film-overlay" />
        <ChapterRail />
        <FilmHeader />

        <main>
          <ActIntro />
          <ActCopilot />
          <ActOutro />
        </main>
      </div>
    </MotionConfig>
  );
};

export default CinematicLanding;
