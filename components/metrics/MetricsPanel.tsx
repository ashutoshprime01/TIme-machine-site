// Snapshot metrics panel — stat tiles + technology fingerprint (plan §13, §27).
// All values are direct observations of the archived HTML: FACTS.

import type { SnapshotMetrics, TechSignal } from "@/lib/types";
import { ANALYSIS_VERSION } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line-soft bg-panel px-3 py-2.5">
      <div className="text-xl font-semibold tabular-nums text-fog">{value}</div>
      <div className="text-xs text-faint mt-0.5">{label}</div>
    </div>
  );
}

const CONFIDENCE_ORDER = { high: 0, medium: 1, low: 2 } as const;

export function MetricsPanel({ metrics }: { metrics: SnapshotMetrics }) {
  const signals = [...metrics.techSignals].sort(
    (a, b) => CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence]
  );

  return (
    <section aria-labelledby="metrics-heading" className="space-y-4">
      <div className="flex items-center gap-2.5">
        <h2 id="metrics-heading" className="text-lg font-semibold">
          Snapshot measurements
        </h2>
        <StatusBadge status="FACT" />
      </div>
      <p className="text-sm text-faint">
        Deterministic counts from the archived HTML. Analysis v{ANALYSIS_VERSION} —
        see <a href="/about" className="underline underline-offset-2 hover:text-fog">methodology</a>.
      </p>

      <h3 className="text-xs font-semibold uppercase tracking-wider text-faint">Content</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Tile label="words" value={fmt(metrics.wordCount)} />
        <Tile label="links" value={fmt(metrics.linkCount)} />
        <Tile label="images" value={fmt(metrics.imageCount)} />
        <Tile label="headings" value={fmt(metrics.headingCount)} />
      </div>

      <h3 className="text-xs font-semibold uppercase tracking-wider text-faint">Structure</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Tile label="DOM elements" value={fmt(metrics.domNodes)} />
        <Tile label="DOM depth" value={fmt(metrics.domDepth)} />
        <Tile label="tables" value={fmt(metrics.tableCount)} />
        <Tile label="lists" value={fmt(metrics.listCount)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Tile label="navigation links" value={fmt(metrics.navLinks)} />
        <Tile label="nav regions" value={fmt(metrics.navRegions)} />
        <Tile label="forms" value={fmt(metrics.formCount)} />
        <Tile label="page size" value={`${Math.round(metrics.pageSizeBytes / 1024)} KB`} />
      </div>

      <h3 className="text-xs font-semibold uppercase tracking-wider text-faint">
        Technology fingerprint
      </h3>
      {signals.length === 0 ? (
        <p className="text-sm text-faint">No identifiable technology signals in this capture.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {signals.map((s) => (
            <TechChip key={s.name} signal={s} />
          ))}
        </ul>
      )}
      <p className="text-xs text-faint">
        Confidence reflects the strength of evidence — never treated as certainty
        (plan §27). High = explicit markup; medium = recognizable reference; low =
        weak pattern.
      </p>
    </section>
  );
}

function TechChip({ signal }: { signal: TechSignal }) {
  const color =
    signal.confidence === "high"
      ? "border-line text-fog"
      : signal.confidence === "medium"
        ? "border-line text-mist"
        : "border-line-soft text-faint";
  return (
    <li
      className={`rounded-md border bg-panel px-2.5 py-1 text-xs ${color}`}
      title={`${signal.evidence} · confidence: ${signal.confidence}`}
    >
      {signal.name}
      <span className="text-faint"> · {signal.confidence}</span>
    </li>
  );
}
