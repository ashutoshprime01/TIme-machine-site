"use client";

// Scroll progress: a hairline amber bar across the top of the page
// plus a fixed mono readout of the "current era year" — interpolated
// from how far you've scrolled, 1991 at the top landing 2026 at the
// page end. Pure CSS scroll-timeline where supported; the year
// readout is a tiny rAF listener. Desktop only; reduced-motion hides
// the year ticker but keeps the static progress bar.

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

const START_YEAR = 1991;
const END_YEAR = 2026;

export function ScrollProgress() {
  const reduced = useReducedMotion();
  const [year, setYear] = useState(START_YEAR);
  const [pct, setPct] = useState(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // only meaningful on tall pages with fine pointers; mobile keeps
    // its browser chrome and doesn't need the floating readout
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    setEnabled(true);

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const t = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        setPct(t);
        setYear(Math.round(START_YEAR + t * (END_YEAR - START_YEAR)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* hairline progress bar */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[70] h-px bg-white/5"
      >
        <div
          className="h-full bg-amber-bright/80 shadow-[0_0_8px_rgba(232,180,90,0.6)]"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      {/* era year readout */}
      {!reduced && (
        <div
          aria-hidden="true"
          className="fixed right-5 top-16 z-[70] hidden text-right font-mono tabular-nums lg:block"
        >
          <span className="text-xl text-fog/80">{year}</span>
          <span className="ml-2 text-[9px] uppercase tracking-[0.25em] text-faint">
            era
          </span>
        </div>
      )}
    </>
  );
}
