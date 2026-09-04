"use client";

// Timeline scrubber: a floating tactical panel with the year axis and
// a draggable cursor. Scrubbing writes the year to the OS store, which
// the 3D camera rig and particle shader follow. Clicking a capture-year
// tick navigates to that snapshot.

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOs } from "@/lib/os/store";

export function TimelineScrubber({
  domain,
  years,
}: {
  domain: string;
  years: number[]; // capture years with data, ascending
}) {
  const setYear = useOs((s) => s.setYear);
  const scrubbed = useOs((s) => s.year);
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverYear, setHoverYear] = useState<number | null>(null);

  const min = years.length ? years[0] : 1991;
  const max = years.length ? years[years.length - 1] : 2026;
  const span = Math.max(max - min, 1);

  const yearFromClientX = useCallback(
    (clientX: number) => {
      const rect = trackRef.current!.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return Math.round(min + t * span);
    },
    [min, span]
  );

  const onTrackPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setYear(yearFromClientX(e.clientX));
  };
  const onTrackPointerMove = (e: React.PointerEvent) => {
    if (e.buttons & 1) setYear(yearFromClientX(e.clientX));
    setHoverYear(yearFromClientX(e.clientX));
  };
  const onTrackPointerLeave = () => setHoverYear(null);

  const pct = scrubbed === null ? null : ((scrubbed - min) / span) * 100;

  return (
    <div className="hud-panel w-full lg:w-[min(640px,calc(100vw-2rem))]">
      <div className="hud-title">
        <span className="hud-dot hud-dot-fact" />
        <span>Timeline / {min}–{max}</span>
        <span className="ml-auto tabular-nums text-ice tracking-normal normal-case">
          {scrubbed === null ? "FREE CAM" : `T-${scrubbed}`}
        </span>
      </div>
      <div className="px-5 pb-5 pt-4">
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Timeline year"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={scrubbed ?? undefined}
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackPointerMove}
          onPointerLeave={onTrackPointerLeave}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setYear(Math.max(min, (scrubbed ?? min) - 1));
            if (e.key === "ArrowRight") setYear(Math.min(max, (scrubbed ?? min) + 1));
          }}
          className="relative h-12 lg:h-10 cursor-ew-resize touch-none"
        >
          {/* axis */}
          <div className="absolute left-0 right-0 top-4 h-px bg-line" />
          {/* ticks: only years with captures are navigable */}
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onPointerEnter={() => setHoverYear(y)}
              onClick={() => {
                setYear(y);
                // navigate to the closest capture of this year via search
                router.push(`/entity/${domain}?year=${y}`);
              }}
              title={`Travel to ${y}`}
              className="absolute top-0 -translate-x-1/2 px-1.5 py-2.5 lg:py-2"
              style={{ left: `${((y - min) / span) * 100}%` }}
            >
              <span
                className={`block w-1.5 h-1.5 rounded-full ${
                  scrubbed === y
                    ? "bg-ice shadow-[0_0_10px_2px_rgba(111,214,255,0.8)]"
                    : "bg-faint hover:bg-mist"
                }`}
              />
              <span
                className={`mt-1 block font-mono text-[9px] tabular-nums ${
                  y % 5 === 0 || scrubbed === y ? "text-mist" : "text-faint/50"
                }`}
              >
                {y % 5 === 0 || scrubbed === y ? y : "·"}
              </span>
            </button>
          ))}
          {/* cursor */}
          {pct !== null && (
            <div
              className="absolute top-1.5 -translate-x-1/2 pointer-events-none transition-none"
              style={{ left: `${pct}%` }}
            >
              <div className="w-0.5 h-7 bg-ice shadow-[0_0_12px_2px_rgba(111,214,255,0.7)]" />
            </div>
          )}
          {/* hover label */}
          {hoverYear !== null && (
            <div
              className="absolute -top-0.5 -translate-x-1/2 pointer-events-none font-mono text-[10px] tabular-nums text-ice"
              style={{ left: `${((hoverYear - min) / span) * 100}%` }}
            >
              {hoverYear}
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
            <span className="text-ice">●</span> FACT — capture years from archive
          </p>
          <button
            type="button"
            onClick={() => setYear(null)}
            className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint hover:text-fog transition-colors"
          >
            Release cam
          </button>
        </div>
      </div>
    </div>
  );
}
