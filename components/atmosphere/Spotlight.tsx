"use client";

// Spotlight: a soft amber light that follows the pointer across the
// hero — the page notices you. Pure CSS radial gradient whose center
// is two spring-smoothed motion values; no canvas, no WebGL. Desktop
// only; touch and reduced-motion users simply get the static hero.

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, useReducedMotion } from "framer-motion";

export function Spotlight({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  // pointer position as fractions of the viewport (0..1)
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.35);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });

  const xPct = useTransform(sx, (v) => `${(v * 100).toFixed(2)}%`);
  const yPct = useTransform(sy, (v) => `${(v * 100).toFixed(2)}%`);
  const background = useMotionTemplate`radial-gradient(560px circle at ${xPct} ${yPct}, rgba(232,180,90,0.065), transparent 68%)`;

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth);
      my.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my, reduced]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ background }}
    />
  );
}
