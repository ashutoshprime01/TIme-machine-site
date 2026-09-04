// Change meters + detected changes for the compare view (plan §13–14, §19).
// Percentages are explicitly labeled internal comparison metrics.

import type { ComparisonResult } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

const DIMS: Array<{ key: keyof Pick<ComparisonResult, "contentChange" | "structureChange" | "navigationChange" | "technologyChange">; label: string }> = [
  { key: "contentChange", label: "Content change" },
  { key: "structureChange", label: "Structure change" },
  { key: "navigationChange", label: "Navigation change" },
  { key: "technologyChange", label: "Technology change" },
];

export function ChangeMeters({ comparison }: { comparison: ComparisonResult }) {
  return (
    <section aria-labelledby="change-heading" className="space-y-4">
      <div className="flex items-center gap-2.5">
        <h2 id="change-heading" className="text-lg font-semibold">
          Measured change
        </h2>
        <span className="text-[10px] font-semibold tracking-wider uppercase rounded border border-line px-1.5 py-0.5 text-faint">
          Internal metrics
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <dl className="space-y-2.5" aria-label="Change between selected versions">
          {DIMS.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-[8.5rem_1fr_2.6rem] items-center gap-3">
              <dt className="text-sm text-mist">{label}</dt>
              <dd>
                <div
                  className="meter-track h-2 w-full"
                  role="img"
                  aria-label={`${label}: ${comparison[key]} percent`}
                >
                  <div
                    className="meter-fill h-full"
                    style={{ width: `${comparison[key]}%`, backgroundColor: "var(--color-amber)" }}
                  />
                </div>
              </dd>
              <dd className="text-sm text-fog text-right tabular-nums">{comparison[key]}%</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-xl border border-line bg-panel px-6 py-5 text-center sm:min-w-44">
          <div className="text-4xl font-bold tabular-nums text-amber-bright">
            {comparison.evolutionIndex}
          </div>
          <div className="text-xs text-faint mt-1">Evolution Index / 100</div>
        </div>
      </div>

      <p className="text-xs text-faint">
        These percentages are internal comparison metrics derived from the
        deterministic measurements of each capture — heuristic, not objective
        (plan methodology).
      </p>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-mist">Detected changes</h3>
        {comparison.detectedChanges.length === 0 ? (
          <p className="text-sm text-faint">
            No major changes detected between these captures by the deterministic
            detector.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {comparison.detectedChanges.map((change, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 shrink-0">
                  <StatusBadge status={change.status} />
                </span>
                <span className="text-mist">{change.text}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-faint">
          FACT items are direct observations of the captures. INFERENCE items are
          interpretations derived from that evidence — treat them as reading
          aids, not history.
        </p>
      </div>
    </section>
  );
}
