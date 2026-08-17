/**
 * The wiserdoc / AISteth landing experience — a scroll-driven product film.
 *
 * Structure: three "acts" of sticky full-screen scenes whose animation is
 * bound to scroll progress, followed by two conventional sections. The old
 * marketing page remains available at /classic.
 */
import { useEffect, useState } from "react";
import { motion, MotionConfig, useScroll, useSpring } from "framer-motion";
import { ActIntro } from "@/components/film/scenes-intro";
import { ActCopilot } from "@/components/film/scenes-copilot";
import { ActOutro } from "@/components/film/scenes-outro";

function FilmHeader() {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        past
          ? "bg-[#04090b]/70 opacity-100 backdrop-blur-md"
          : "pointer-events-none opacity-0"
      }`}
    >
      <div className="mx-auto flex w-[min(94vw,1100px)] items-center justify-between px-4 py-3.5">
        <a href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-hud font-bold text-[13px] text-[#04140c]">
            AI
          </span>
          <span className="text-sm font-semibold tracking-wide text-white">
            AISteth
          </span>
        </a>
        <a
          href="/app/login?redirect=/em-copilot"
          className="rounded-lg border border-hud/40 bg-hud/10 px-4 py-1.5 text-[13px] font-medium text-hud transition hover:bg-hud/20"
        >
          Sign in
        </a>
      </div>
    </header>
  );
}

/** Thin scroll-progress line — the "film position" indicator. */
function ProgressRail() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-hud/80"
    />
  );
}

const CinematicLanding = () => {
  useEffect(() => {
    document.title = "AISteth — the clinical intelligence layer";
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="film bg-[#04090b] font-sans text-white antialiased">
        <ProgressRail />
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
