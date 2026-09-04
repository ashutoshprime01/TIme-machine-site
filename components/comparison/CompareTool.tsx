"use client";

// Comparison mode (plan §12): side-by-side, overlay slider, measured
// differences, and DNA diff — with a shareable URL for the selection.

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ViewerFrame } from "@/components/snapshot-viewer/ViewerFrame";
import { DnaBarsCompare } from "@/components/dna/DnaBars";
import { ChangeMeters } from "@/components/comparison/ChangeMeters";
import type { Capture, ComparisonResult, DnaProfile, SnapshotMetrics } from "@/lib/types";
import { formatCaptureDate } from "@/lib/security/url";

type Tab = "side-by-side" | "slider" | "differences" | "dna";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "side-by-side", label: "Side by side" },
  { id: "slider", label: "Slider" },
  { id: "differences", label: "Differences" },
  { id: "dna", label: "Internet DNA" },
];

export interface CompareData {
  captureA: Capture;
  captureB: Capture;
  replayA: string;
  replayB: string;
  metricsA: SnapshotMetrics;
  metricsB: SnapshotMetrics;
  dnaA: DnaProfile;
  dnaB: DnaProfile;
  comparison: ComparisonResult;
}

export function CompareTool({
  domain,
  captures,
  initialA,
  initialB,
  data,
}: {
  domain: string;
  captures: Capture[];
  initialA: string;
  initialB: string;
  data: CompareData;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("side-by-side");
  const [slider, setSlider] = useState(50);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, Capture[]>();
    for (const c of captures) {
      const y = c.timestamp.slice(0, 4);
      (map.get(y) ?? map.set(y, []).get(y)!).push(c);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [captures]);

  function navigate(nextA: string, nextB: string) {
    if (nextA === nextB) return;
    router.push(`/entity/${domain}/compare?a=${nextA}&b=${nextB}`);
  }

  async function createShare() {
    setSharing(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          timestampA: data.captureA.timestamp,
          timestampB: data.captureB.timestamp,
        }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (json.url) {
        setShareUrl(`${window.location.origin}${json.url}`);
        await navigator.clipboard?.writeText(`${window.location.origin}${json.url}`).catch(() => {});
      }
    } finally {
      setSharing(false);
    }
  }

  const labelA = formatCaptureDate(data.captureA.timestamp);
  const labelB = formatCaptureDate(data.captureB.timestamp);

  const selector = (which: "a" | "b") => (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-faint">Version {which.toUpperCase()}</span>
      <select
        value={which === "a" ? data.captureA.timestamp : data.captureB.timestamp}
        onChange={(e) =>
          navigate(
            which === "a" ? e.target.value : data.captureA.timestamp,
            which === "b" ? e.target.value : data.captureB.timestamp
          )
        }
        className="rounded-md border border-line bg-panel px-2.5 py-1.5 text-fog max-w-56"
      >
        {grouped.map(([year, list]) => (
          <optgroup key={year} label={year}>
            {list.map((c) => (
              <option key={c.timestamp} value={c.timestamp}>
                {formatCaptureDate(c.timestamp)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );

  return (
    <div className="space-y-5">
      {/* version selectors + share */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {selector("a")}
          {selector("b")}
        </div>
        <div className="flex items-center gap-3">
          {shareUrl && (
            <span className="text-xs text-mist truncate max-w-64" title={shareUrl}>
              Shareable link copied: {shareUrl}
            </span>
          )}
          <button
            type="button"
            onClick={createShare}
            disabled={sharing}
            className="rounded-lg border border-amber bg-amber/10 px-4 py-2 text-sm font-semibold text-amber-bright hover:bg-amber/20 transition-colors disabled:opacity-50"
          >
            {sharing ? "Creating…" : "Share this comparison"}
          </button>
        </div>
      </div>

      {/* tabs */}
      <div role="tablist" aria-label="Comparison views" className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg border-b-2 px-4 py-2 text-sm transition-colors ${
              tab === t.id
                ? "border-amber text-fog font-semibold"
                : "border-transparent text-mist hover:text-fog"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "side-by-side" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <figure className="space-y-2">
            <figcaption className="text-sm font-semibold text-amber-bright">{labelA}</figcaption>
            <ViewerFrame src={data.replayA} title={`Archived page from ${labelA}`} />
          </figure>
          <figure className="space-y-2">
            <figcaption className="text-sm font-semibold text-azure">{labelB}</figcaption>
            <ViewerFrame src={data.replayB} title={`Archived page from ${labelB}`} />
          </figure>
        </div>
      )}

      {tab === "slider" && (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg border border-line bg-[#1c1c28]">
            <div className="overflow-auto max-h-[75vh]">
              <div className="relative w-[1280px]">
                <iframe
                  src={data.replayB}
                  title={`Archived page from ${labelB}`}
                  sandbox=""
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="h-[860px] w-full border-0 bg-white"
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}
                >
                  <iframe
                    src={data.replayA}
                    title={`Archived page from ${labelA}`}
                    sandbox=""
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="h-[860px] w-full border-0 bg-white"
                  />
                </div>
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-bright/80 pointer-events-none"
                  style={{ left: `${slider}%` }}
                />
              </div>
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm text-mist">
            <span className="shrink-0 text-amber-bright">{labelA}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={slider}
              onChange={(e) => setSlider(Number(e.target.value))}
              aria-label="Comparison slider between the two versions"
              className="flex-1 accent-amber-bright"
            />
            <span className="shrink-0 text-azure">{labelB}</span>
          </label>
          <p className="text-xs text-faint">
            Drag the slider to wipe between the two captures.
          </p>
        </div>
      )}

      {tab === "differences" && <ChangeMeters comparison={data.comparison} />}

      {tab === "dna" && (
        <div className="space-y-4">
          <DnaBarsCompare dnaA={data.dnaA} dnaB={data.dnaB} labelA={labelA} labelB={labelB} />
          <p className="text-xs text-faint">
            DNA scores are deterministic heuristics computed from each capture&apos;s
            measurable signals — analytical tools, not objective truth.
          </p>
        </div>
      )}
    </div>
  );
}
