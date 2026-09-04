"use client";

// Internet DNA HUD panel: the site's epistemic profile for the scrubbed
// (or latest) year, rendered as compact bars. The panel is draggable;
// its dot is FACT cyan because the DNA is measured, not imagined.

import { useOs } from "@/lib/os/store";
import { HudPanel } from "./HudPanel";
import type { DnaProfile } from "@/lib/types";

const DIMENSIONS: Array<[keyof DnaProfile, string]> = [
  ["minimalism", "MINIMALISM"],
  ["informationDensity", "INFO DENSITY"],
  ["commercialization", "COMMERCIAL"],
  ["mediaIntensity", "MEDIA INTENSITY"],
  ["mobileFocus", "MOBILE FOCUS"],
];

export function DnaHudPanel({ dna }: { dna: DnaProfile }) {
  return (
    <HudPanel
      title="Internet DNA"
      epistemic="fact"
      initial={{ x: 24, y: 420 }}
      bodyClassName="p-4 w-full lg:w-64"
    >
      <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
        Profile v{dna.algorithmVersion} · 0–100
      </p>
      <ul className="space-y-2.5">
        {DIMENSIONS.map(([key, label]) => {
          const v = dna[key] as number;
          return (
            <li key={key}>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist">
                  {label}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-fog">{v}</span>
              </div>
              <div className="mt-1 h-1 w-full rounded-full overflow-hidden bg-line-soft">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-ice/70 to-ice"
                  style={{ width: `${Math.min(v, 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 font-mono text-[9px] leading-relaxed text-faint">
        <span className="text-ice">FACT</span> — deterministic profile (DNA v
        {dna.algorithmVersion}), no AI.
      </p>
    </HudPanel>
  );
}
