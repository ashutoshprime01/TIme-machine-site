"use client";

// Magnetic wrapper: its children lean toward the pointer while the
// pointer is inside (or near) the element — a subtle physical pull,
// released with a spring. Desktop-only: coarse pointers and
// reduced-motion users get the plain child.

import { useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

export function Magnetic({
  children,
  strength = 0.35,
  radius = 0,
  className = "",
}: {
  children: ReactNode;
  /** How far the child leans toward the cursor (fraction of offset). */
  strength?: number;
  /** Extra grab radius beyond the element's box, in px (0 = inside only). */
  radius?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(true);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.6 });

  function onPointerMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || !enabled || e.pointerType !== "mouse") return;
    const rect = el.getBoundingClientRect();
    // pointer position relative to element center
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    // inside the box + radius?
    const inside =
      Math.abs(dx) <= rect.width / 2 + radius &&
      Math.abs(dy) <= rect.height / 2 + radius;
    if (inside) {
      x.set(dx * strength);
      y.set(dy * strength);
    } else {
      x.set(0);
      y.set(0);
    }
  }

  function onPointerLeave() {
    x.set(0);
    y.set(0);
  }

  // disable entirely on touch/reduced motion (pointer events still
  // check e.pointerType, this covers the media-query cases)
  function onPointerEnter(e: React.PointerEvent) {
    setEnabled(e.pointerType === "mouse" && !reduced);
  }

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: sx, y: sy }}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </motion.div>
  );
}
