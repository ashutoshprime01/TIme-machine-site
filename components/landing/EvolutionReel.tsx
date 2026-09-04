"use client";

// The Evolution Reel: the generated documentary film — the five era
// plates crossfading 1991→2026 with film grain — playing continuously
// in a museum monitor frame. Autoplaying muted looping video; honors
// prefers-reduced-motion by showing the poster still instead.

import { useReducedMotion } from "framer-motion";

export function EvolutionReel() {
  const reduced = useReducedMotion();

  return (
    <figure className="mt-10">
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl shadow-black/50">
        {reduced ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/artifacts/web-evolution-poster.jpg"
            alt="The evolution of the web from 1991 to 2026, still frame"
            className="aspect-[8/5] w-full object-cover"
          />
        ) : (
          <video
            className="aspect-[8/5] w-full object-cover"
            src="/artifacts/web-evolution.mp4"
            poster="/artifacts/web-evolution-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        )}
        {/* monitor dressing */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_60px_rgba(0,0,0,0.55)]" />
        <div aria-hidden="true" className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500/80" />
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-fog/70">
            reel · 1991—2026
          </span>
        </div>
      </div>
      <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        Stylized specimen plates, generated in-house · the real archive is one search away
      </figcaption>
    </figure>
  );
}
