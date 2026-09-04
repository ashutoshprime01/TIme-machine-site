"use client";

// Scroll reveal: sections surface through motion and depth — rising,
// settling from slightly smaller, and coming into focus (blur→sharp)
// as they enter the viewport. once = true by default (a museum, not
// a funfair). Reduced-motion users get plain children.

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function Reveal({
  children,
  className = "",
  delay = 0,
  depth = 28,
  once = true,
  amount = 0.25,
}: {
  children: ReactNode;
  className?: string;
  /** Extra stagger inside a section, in seconds. */
  delay?: number;
  /** How many px the block rises. */
  depth?: number;
  once?: boolean;
  /** Fraction of the block that must be visible to trigger. */
  amount?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: depth, scale: 0.985, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once, amount }}
      transition={{ type: "spring", stiffness: 90, damping: 20, delay }}
    >
      {children}
    </motion.div>
  );
}
