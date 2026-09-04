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
    <div className="relative h-[calc(100vh-5rem)] min-h-[620px] w-full touch-pan-y">
      <OsCanvas />

      {/* floating HUD panels — absolutely positioned on lg+, stacked in
          a scrollable flow on mobile (panels are static there, see
          the <lg media override on .hud-panel) */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-3 overflow-y-auto p-4 lg:block lg:overflow-visible lg:p-0">
        <div className="pointer-events-auto w-full lg:absolute lg:left-4 lg:top-4 lg:w-[min(440px,calc(100vw-2rem))]">
          <SearchBar initialValue={domain} size="compact" />
        </div>

        {/* drawer launchpad */}
        <div className="pointer-events-auto flex gap-2 lg:absolute lg:right-4 lg:top-4">
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

        {dna && (
          <div className="pointer-events-auto lg:absolute lg:right-4 lg:top-24">
            <DnaHudPanel dna={dna} />
          </div>
        )}

        <div className="pointer-events-auto lg:absolute lg:left-4 lg:top-[210px]">
          <TargetPanel
            domain={domain}
            firstTimestamp={firstTimestamp}
            latestTimestamp={latestTimestamp}
            yearsCount={years.length}
          />
        </div>

        <div className="pointer-events-auto mt-auto lg:absolute lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2 lg:mt-0">
          <TimelineScrubber domain={domain} years={years} />
        </div>
      </div>

      {/* off-canvas drawers — canvas stays visible behind the glass */}
      <OsDrawers>
        <LabDrawerContent domain={domain} firstTimestamp={firstTimestamp} latestTimestamp={latestTimestamp}>
          {labContent}
        </LabDrawerContent>
        <>{compareContent}</>
      </OsDrawers>

      {/* hint strip */}
      <div className="absolute bottom-1 right-4 z-10 hidden lg:block font-mono text-[9px] uppercase tracking-[0.2em] text-faint/70 pointer-events-none">
        Drag empty space to pan · scroll to zoom · drag titles to move panels
      </div>
      <div className="absolute bottom-1 right-4 z-10 lg:hidden font-mono text-[9px] uppercase tracking-[0.2em] text-faint/70 pointer-events-none">
        Swipe sideways to pan · pinch to zoom
      </div>
    </div>
  );
}

/** Target stats + travel actions panel. */
function TargetPanel({
  domain,
  firstTimestamp,
  latestTimestamp,
  yearsCount,
}: {
  domain: string;
  firstTimestamp: string;
  latestTimestamp: string;
  yearsCount: number;
}) {
  return (
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
          <dd className="text-fog">{yearsCount}</dd>
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
