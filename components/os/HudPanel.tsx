"use client";

// Draggable HUD panel: frosted glass, mono title bar with an epistemic
// status dot, corner brackets. Mounts with a spring (scale 0.92 → 1,
// y +24 → 0, opacity). The drag handle is the title bar — pointer
// events on body content are untouched, so inputs and links keep
// working inside the panel. Dragging is desktop-only: below lg (or on
// coarse pointers) panels sit in the page flow and are not draggable,
// so touch scrolling is never hijacked.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useDragControls } from "framer-motion";
import { reduceMotionPreference } from "./motion";

const SPRING = { type: "spring", stiffness: 380, damping: 32, mass: 0.9 } as const;

/** Desktop layout: wide screen + fine pointer (mouse/trackpad). */
function useDesktopLayout(): boolean {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isDesktop;
}

export function HudPanel({
  title,
  epistemic = "fact",
  children,
  className = "",
  initial = { x: 24, y: 96 },
  bodyClassName = "p-4",
}: {
  title: string;
  /** Epistemic status of the panel's contents — drives the dot color. */
  epistemic?: "fact" | "hypothesis";
  children: ReactNode;
  className?: string;
  /** Initial absolute position in px from top-left of the OS layer. */
  initial?: { x: number; y: number };
  bodyClassName?: string;
}) {
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = reduceMotionPreference();
  const draggable = useDesktopLayout();

  return (
    <motion.div
      ref={panelRef}
      className={`hud-panel ${className}`}
      style={draggable ? { left: initial.x, top: initial.y } : undefined}
      initial={reduced ? false : { opacity: 0, scale: 0.92, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 12 }}
      transition={SPRING}
      drag={draggable}
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0.08}
      dragConstraints={panelRef}
      // keep panels on screen
      onDragEnd={() => {
        const el = panelRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.left < 0 || rect.top < 0 || rect.right > innerWidth || rect.bottom > innerHeight) {
          el.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - 100))}px`;
          el.style.top = `${Math.max(8, Math.min(rect.top, innerHeight - 100))}px`;
          el.style.transform = "none";
        }
      }}
      role="group"
      aria-label={title}
    >
      <div
        className="hud-title"
        onPointerDown={(e) => draggable && dragControls.start(e)}
        title={draggable ? "Drag to reposition" : undefined}
      >
        <span className={`hud-dot ${epistemic === "fact" ? "hud-dot-fact" : "hud-dot-hypothesis"}`} />
        <span>{title}</span>
        <span className="ml-auto text-faint tracking-normal normal-case" aria-hidden="true">
          {draggable ? "⠿" : "▤"}
        </span>
      </div>
      <div className={bodyClassName}>{children}</div>
    </motion.div>
  );
}
