"use client";

// Then & Now: a draggable divider wipes between the 1996 and 2026
// specimen plates — the oldest and newest web, face to face. The top
// layer is clipped with clip-path; the handle is a real slider role
// with keyboard support (arrows move the divider). Pure pointer math,
// no images are modified.

import { useRef, useState } from "react";
import { motion } from "framer-motion";

const THEN = "/artifacts/era-1996.jpg";
const NOW = "/artifacts/era-2026.jpg";

export function EraCompare() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // percent, divider position
  const [dragging, setDragging] = useState(false);

  function setFromClientX(clientX: number) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    setFromClientX(e.clientX);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setFromClientX(e.clientX);
  }
  function onPointerUp() {
    setDragging(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
    if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
  }

  return (
    <div className="mt-10">
      <div
        ref={ref}
        data-cursor="drag"
        className="relative aspect-[16/10] w-full select-none overflow-hidden rounded-xl border border-white/10 cursor-ew-resize"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* NOW (bottom layer, full bleed) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={NOW} alt="The web in 2026 — AI-era interface, specimen plate" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        {/* THEN (top layer, clipped to the divider) */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={THEN} alt="The web in 1996 — table-era homepage, specimen plate" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          <span className="absolute left-3 top-3 rounded bg-black/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-fog backdrop-blur-sm">
            1996 · specimen plate
          </span>
        </div>
        <span className="absolute right-3 top-3 rounded bg-black/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-fog backdrop-blur-sm">
          2026 · specimen plate
        </span>

        {/* the divider + handle */}
        <div
          className="absolute inset-y-0 w-px bg-amber-bright shadow-[0_0_16px_rgba(232,180,90,0.6)]"
          style={{ left: `${pos}%` }}
        >
          <div
            role="slider"
            tabIndex={0}
            aria-label="Comparison divider — 1996 versus 2026"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            onKeyDown={onKeyDown}
            className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-amber-bright/70 bg-ink/80 backdrop-blur-sm focus-visible:outline-2"
          >
            <span aria-hidden="true" className="font-mono text-xs text-amber-bright tracking-tighter select-none">
              ‹ ›
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        <span>table layouts · blue links · counters</span>
        <motion.span animate={{ opacity: dragging ? 1 : 0.5 }} className="text-amber-bright">
          drag the divider
        </motion.span>
        <span>prompt bars · generated cards</span>
      </div>
    </div>
  );
}
