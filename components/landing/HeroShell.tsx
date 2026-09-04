"use client";

// Hero shell: the hero content dissolves as you scroll away —
// opacity 1→0 and scale 1→0.94 across the first viewport height
// (scroll-linked, GPU transforms only). Reduced motion: static.

import { type ReactNode, useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export function HeroShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <div ref={ref} className="relative h-full">
      <motion.div
        style={reduced ? undefined : { opacity, scale, y }}
        className="h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
