"use client";

// Cinematic year rail: a draggable strip of years that physically
// moves with the pointer — the year nearest center grows dominant
// (scale, glow, amber), neighbors recede. Released, the rail springs
// so the dominant year lands exactly on the center marker. Clicking a
// year navigates to that entity-year on the demo domain. Touch works
// (pointer events), reduced-motion gets a static wrapped row.

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { Magnetic } from "@/components/motion/Magnetic";

const YEARS = Array.from({ length: 36 }, (_, i) => 1991 + i); // 1991..2026
const DEMO_DOMAIN = "info.cern.ch";
const YEAR_W = 76; // px per year in the rail

export function YearRail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [centerYear, setCenterYear] = useState(2008);
  const [dragging, setDragging] = useState(false);
  const [hoverYear, setHoverYear] = useState<number | null>(null);

  // rail position: x = 0 puts year 1991 at the left edge. The rail
  // always renders through the spring; while dragging the spring is
  // stiff (near 1:1 with the pointer), on release it softens for the
  // cinematic settle onto the dominant year.
  const x = useMotionValue(0);
  const sx = useSpring(x, dragging ? { stiffness: 1000, damping: 90 } : { stiffness: 130, damping: 24 });

  // which year sits under the center marker — tracked on the *rendered*
  // position so the readout follows the settle animation too
  useEffect(() => {
    const update = (latest: number) => {
      const el = containerRef.current;
      if (!el) return;
      const center = el.getBoundingClientRect().width / 2;
      const yearAtCenter = Math.round(1991 + (center - latest) / YEAR_W);
      setCenterYear(Math.min(2026, Math.max(1991, yearAtCenter)));
    };
    const unsub = sx.on("change", update);
    // initial: center 2008
    requestAnimationFrame(() => {
      const el = containerRef.current;
      if (!el) return;
      x.set(el.getBoundingClientRect().width / 2 - (2008 - 1991) * YEAR_W);
    });
    return unsub;
  }, [x, sx]);

  // keep the current year centered when the viewport resizes
  useEffect(() => {
    const onResize = () => {
      const el = containerRef.current;
      if (!el) return;
      const center = el.getBoundingClientRect().width / 2;
      x.set(center - (centerYear - 1991) * YEAR_W);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [x, centerYear]);

  // clamp helper
  const clampX = (v: number) => {
    const el = containerRef.current;
    if (!el) return v;
    const w = el.getBoundingClientRect().width;
    return Math.min(w / 2 - (1991 - 1991) * YEAR_W, Math.max(w / 2 - 36 * YEAR_W, v));
  };

  function onPointerDown(e: React.PointerEvent) {
    if (reduced) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    x.stop();
    x.jump(clampX(x.get()));
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    x.set(clampX(x.get() + e.movementX));
  }
  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    // snap the dominant year to center
    const el = containerRef.current;
    if (!el) return;
    const center = el.getBoundingClientRect().width / 2;
    x.set(center - (centerYear - 1991) * YEAR_W);
  }

  // dominant-year proximity: rail-px of the center marker, tracked on
  // the rendered (spring) position so markers follow the settle
  const distFromCenter = useTransform(sx, (v) => {
    const el = containerRef.current;
    const center = el ? el.getBoundingClientRect().width / 2 : 0;
    return center - v;
  });

  const yearAt = (y: number) => (y - 1991) * YEAR_W;

  return (
    <div className="relative">
      {/* center marker */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 z-10 flex flex-col items-center">
        <span className="h-10 w-px bg-amber-bright/70 shadow-[0_0_12px_rgba(232,180,90,0.6)]" />
        <span className="mt-1 rounded-full border border-amber-bright/50 bg-amber/10 px-2 py-0.5 font-mono text-[10px] tabular-nums text-amber-bright">
          {centerYear}
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden py-14 cursor-ew-resize touch-pan-y select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* edge fades */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-ink to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-ink to-transparent" />

        <motion.div
          ref={railRef}
          className="flex items-center"
          style={{ x: sx }}
        >
          {YEARS.map((y) => (
            <YearMarker
              key={y}
              year={y}
              dominant={y === centerYear}
              hovered={y === hoverYear}
              distFromCenter={distFromCenter}
              railX={yearAt(y)}
              reduced={!!reduced}
              onEnter={() => setHoverYear(y)}
              onLeave={() => setHoverYear(null)}
            />
          ))}
        </motion.div>
      </div>

      {/* selected-year readout + link */}
      <div className="mt-2 flex items-center justify-center gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
          Selected era: <span className="text-amber-bright tabular-nums">{centerYear}</span>
        </p>
        <Magnetic strength={0.25} className="inline-block">
          <Link
            href={`/entity/${DEMO_DOMAIN}/snapshot/${centerYear}0101000000`}
            className="btn-ghost px-4 py-1.5 text-xs font-semibold"
          >
            View {centerYear} captures →
          </Link>
        </Magnetic>
      </div>
    </div>
  );
}

/** One year in the rail: size/glow by proximity to the center marker. */
function YearMarker({
  year,
  dominant,
  hovered,
  distFromCenter,
  railX,
  reduced,
  onEnter,
  onLeave,
}: {
  year: number;
  dominant: boolean;
  hovered: boolean;
  distFromCenter: ReturnType<typeof useTransform<number, number>>;
  railX: number;
  reduced: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  // proximity 0 (at center) .. 1 (far away) — computed per frame
  const proximity = useTransform(distFromCenter, (c) =>
    Math.min(1, Math.abs(c - railX) / (YEAR_W * 6))
  );
  const scale = useTransform(proximity, [0, 1], [1.6, 0.72]);
  const opacity = useTransform(proximity, [0, 0.85, 1], [1, 0.55, 0.25]);

  const big = dominant || hovered;
  const anchor = (
    <span
      className={`relative flex h-16 w-[76px] shrink-0 flex-col items-center justify-center font-mono tabular-nums transition-colors ${
        dominant ? "text-amber-bright" : big ? "text-fog" : "text-faint"
      }`}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <span className="text-sm font-semibold">{year}</span>
      <span
        className={`mt-1.5 rounded-full transition-all duration-300 ${
          dominant
            ? "h-2 w-2 bg-amber-bright shadow-[0_0_14px_3px_rgba(232,180,90,0.55)]"
            : big
              ? "h-1.5 w-1.5 bg-fog/70"
              : "h-1 w-1 bg-faint/60"
        }`}
      />
    </span>
  );

  if (reduced) return <Link href={`/entity/info.cern.ch/snapshot/${year}0101000000`}>{anchor}</Link>;

  return (
    <motion.span style={{ scale, opacity }} className="shrink-0">
      <Link href={`/entity/${DEMO_DOMAIN}/snapshot/${year}0101000000`} aria-label={`View ${year}`}>
        {anchor}
      </Link>
    </motion.span>
  );
}
