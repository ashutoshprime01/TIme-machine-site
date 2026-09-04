"use client";

// The Intelligence OS shell (client): composes the 3D canvas, the
// floating HUD panels (search, scrubber, DNA), the drawer launchpad
// and the drawer overlays. Server data arrives as props and is pushed
// into the OS store for the canvas/particles.

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useOs } from "@/lib/os/store";
import { OsCanvas } from "./OsCanvas";
import { HudPanel } from "./HudPanel";
import { TimelineScrubber } from "./TimelineScrubber";
import { DnaHudPanel } from "./DnaHudPanel";
import { OsDrawers } from "./OsDrawers";
import { SearchBar } from "@/components/SearchBar";
import type { DnaProfile } from "@/lib/types";
import type { ReactNode } from "react";

export function OsShell({
  domain,
  years,
  firstTimestamp,
  latestTimestamp,
  dna,
  labContent,
  compareContent,
}: {
  domain: string;
  years: number[];
  firstTimestamp: string;
  latestTimestamp: string;
  dna: DnaProfile | null;
  labContent: ReactNode;
  compareContent: ReactNode;
}) {
  const setYears = useOs((s) => s.setYears);
  const toggleDrawer = useOs((s) => s.toggleDrawer);
  const drawer = useOs((s) => s.drawer);

  // feed the capture years to the canvas particles
  useEffect(() => {
    setYears(years);
  }, [years, setYears]);

  return (
    <div className="relative h-[calc(100vh-5rem)] min-h-[620px] w-full">
      <OsCanvas />

      {/* floating HUD panels */}
      <div className="absolute inset-0">
        <div className="absolute left-4 top-4 z-10 w-[min(440px,calc(100vw-2rem))]">
          <SearchBar initialValue={domain} size="compact" />
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <TimelineScrubber domain={domain} years={years} />
        </div>

        {dna && (
          <div className="absolute right-4 top-20 z-10">
            <DnaHudPanel dna={dna} />
          </div>
        )}

        {/* drawer launchpad */}
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <button
            type="button"
            className="hud-toggle"
            onClick={() => toggleDrawer("compare")}
            aria-pressed={drawer === "compare"}
          >
            <span className="hud-dot hud-dot-fact" />
            Compare
          </button>
          <button
            type="button"
            className="hud-toggle"
            onClick={() => toggleDrawer("lab")}
            aria-pressed={drawer === "lab"}
          >
            <span className="hud-dot hud-dot-hypothesis" />
            Lab
          </button>
        </div>

        {/* target stats panel */}
        <HudPanel
          title="Target"
          epistemic="fact"
          initial={{ x: 24, y: 210 }}
          bodyClassName="p-4 w-56"
        >
          <p className="font-mono text-sm text-fog truncate">{domain}</p>
          <dl className="mt-3 space-y-1.5 font-mono text-[10px] tabular-nums">
            <div className="flex justify-between">
              <dt className="text-faint">FIRST CAP</dt>
              <dd className="text-fog">{firstTimestamp.slice(0, 4)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-faint">LATEST CAP</dt>
              <dd className="text-fog">{latestTimestamp.slice(0, 4)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-faint">YEARS</dt>
              <dd className="text-fog">{years.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-faint">ENGINE</dt>
              <dd className="text-ice">R3F · BLOOM</dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-col gap-1.5">
            <a
              href={`/entity/${domain}/snapshot/${firstTimestamp}`}
              className="btn-primary px-3 py-1.5 text-xs"
            >
              ⇦ Travel to {firstTimestamp.slice(0, 4)}
            </a>
            <a
              href={`/entity/${domain}/snapshot/${latestTimestamp}`}
              className="btn-primary px-3 py-1.5 text-xs"
            >
              Travel to {latestTimestamp.slice(0, 4)} ⇨
            </a>
            <a
              href={`/entity/${domain}/evolution`}
              className="btn-ghost px-3 py-1.5 text-xs font-semibold"
            >
              Evolution report ↗
            </a>
          </div>
        </HudPanel>
      </div>

      {/* off-canvas drawers — canvas stays visible behind the glass */}
      <OsDrawers>
        <LabDrawerContent domain={domain} firstTimestamp={firstTimestamp} latestTimestamp={latestTimestamp}>
          {labContent}
        </LabDrawerContent>
        <>{compareContent}</>
      </OsDrawers>

      {/* hint strip */}
      <div className="absolute bottom-1 right-4 z-10 font-mono text-[9px] uppercase tracking-[0.2em] text-faint/70 pointer-events-none">
        Drag empty space to pan · scroll to zoom · drag titles to move panels
      </div>
    </div>
  );
}

import { useState } from "react";
import { useRouter } from "next/navigation";

function LabDrawerContent({
  domain,
  firstTimestamp,
  latestTimestamp,
  children,
}: {
  domain: string;
  firstTimestamp: string;
  latestTimestamp: string;
  children: ReactNode;
}) {
  // Quick pickers that deep-link into the full Lab page
  const [mode, setMode] = useState("modernize");
  const router = useRouter();

  return (
    <div className="space-y-5">
      <div className="glass-strong rounded-lg border-amber/60 bg-amber/10 p-4 animate-section">
        <p className="font-mono text-xs font-bold tracking-[0.15em] text-amber-bright">
          HYPOTHETICAL — NOT HISTORICAL
        </p>
        <p className="mt-1 text-xs text-mist">
          Lab transformations are deterministic thought experiments. {domain}
          &apos;s real history is untouched.
        </p>
      </div>
      <div>
        <label htmlFor="drawer-mode" className="block font-mono text-[10px] uppercase tracking-[0.18em] text-faint mb-1.5">
          Transformation mode
        </label>
        <select
          id="drawer-mode"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="w-full rounded-md border border-line bg-raised px-3 py-2 text-sm text-fog"
        >
          {[
            ["modernize", "Modernize"],
            ["minimalize", "Minimalize"],
            ["mobile-first", "Mobile-first"],
            ["maximal-media", "Maximal media"],
            ["commerce-first", "Commerce-first"],
            ["retro-web", "Retro web"],
            ["ai-native", "AI-native"],
          ].map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="btn-primary w-full px-4 py-2.5 text-sm"
        onClick={() =>
          router.push(`/entity/${domain}/lab?t=${firstTimestamp}&mode=${mode}`)
        }
      >
        Open experiment in Lab ⚗
      </button>
      <button
        type="button"
        className="btn-ghost w-full px-4 py-2.5 text-sm font-semibold"
        onClick={() =>
          router.push(`/entity/${domain}/compare?a=${firstTimestamp}&b=${latestTimestamp}`)
        }
      >
        Compare {firstTimestamp.slice(0, 4)} vs {latestTimestamp.slice(0, 4)}
      </button>
      {children}
    </div>
  );
}
