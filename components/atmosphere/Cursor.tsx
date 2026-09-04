"use client";

// Custom cursor: an instant dot plus a spring-trailing ring, desktop
// fine-pointers only. The ring expands over interactive elements and
// shows a "drag" state over [data-cursor] labeled elements. The
// native cursor is hidden only while this is active (see .cursor-hidden
// in globals.css). Reduced-motion keeps the native cursor entirely.

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 30, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 350, damping: 30, mass: 0.6 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    document.documentElement.classList.add("cursor-hidden");

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = e.target as HTMLElement | null;
      const interactive = el?.closest("a, button, input, select, textarea, [role='button'], [data-cursor]");
      setHovering(!!interactive);
      const labeled = el?.closest("[data-cursor]") as HTMLElement | null;
      setLabel(labeled?.dataset.cursor ?? null);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("cursor-hidden");
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      {/* the dot: exactly on the pointer */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-amber-bright"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      />
      {/* the ring: trails with a spring, expands over interactive
          elements, carries an optional mono label */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[99] flex items-center justify-center rounded-full border border-fog/40"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: label ? 64 : hovering ? 40 : 26,
          height: label ? 64 : hovering ? 40 : 26,
          borderColor: hovering ? "rgba(232,180,90,0.7)" : "rgba(244,244,250,0.35)",
        }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
      >
        {label && (
          <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-amber-bright select-none">
            {label}
          </span>
        )}
      </motion.div>
    </>
  );
}
