// Internet DNA meter chart (plan §15). Labeled meter list — each row carries
// its value, so identity/reading never depends on color or hover alone.
// Marks: thin bars, 4px rounded data-end on the baseline, 2px gap between
// the two series' bars. Text wears ink tokens, never the series color.

import type { DnaProfile } from "@/lib/types";
import { DNA_LABELS, type DnaDimensions } from "@/lib/types";

const DIMENSIONS = Object.keys(DNA_LABELS) as Array<keyof DnaDimensions>;

function Bar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div
      className="meter-track h-2 w-full"
      role="img"
      aria-label={`${label}: ${value} of 100`}
    >
      <div
        className="meter-fill h-full transition-[width] duration-500"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function DnaBars({ dna }: { dna: DnaProfile }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs text-faint">
        Deterministic heuristic scores, 0–100 · DNA algorithm v{dna.algorithmVersion}
      </p>
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2" aria-label="Internet DNA profile">
        {DIMENSIONS.map((dim) => (
          <div key={dim} className="grid grid-cols-[9.5rem_1fr_2.2rem] items-center gap-3">
            <dt className="text-sm text-mist truncate" title={DNA_LABELS[dim]}>
              {DNA_LABELS[dim]}
            </dt>
            <dd>
              <Bar value={dna[dim]} color="var(--color-amber)" label={DNA_LABELS[dim]} />
            </dd>
            <dd className="text-sm text-fog text-right tabular-nums">{dna[dim]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function DnaBarsCompare({
  dnaA,
  dnaB,
  labelA,
  labelB,
}: {
  dnaA: DnaProfile;
  dnaB: DnaProfile;
  labelA: string;
  labelB: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-mist">
        <span className="font-semibold uppercase tracking-wider text-faint">DNA</span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="w-3 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-amber)" }} />
          {labelA}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="w-3 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-azure)" }} />
          {labelB}
        </span>
        <span className="text-faint">algorithm v{dnaA.algorithmVersion}</span>
      </div>
      <dl className="space-y-2.5" aria-label={`Internet DNA comparison, ${labelA} versus ${labelB}`}>
        {DIMENSIONS.map((dim) => {
          const delta = dnaB[dim] - dnaA[dim];
          return (
            <div key={dim} className="grid grid-cols-[9.5rem_1fr_auto] items-center gap-3">
              <dt className="text-sm text-mist truncate" title={DNA_LABELS[dim]}>
                {DNA_LABELS[dim]}
              </dt>
              <dd className="space-y-0.5">
                <Bar value={dnaA[dim]} color="var(--color-amber)" label={`${DNA_LABELS[dim]}, ${labelA}`} />
                <Bar value={dnaB[dim]} color="var(--color-azure)" label={`${DNA_LABELS[dim]}, ${labelB}`} />
              </dd>
              <dd className="text-xs tabular-nums text-right min-w-16">
                <span className="text-fog">{dnaA[dim]}</span>
                <span className="text-faint"> → </span>
                <span className="text-fog">{dnaB[dim]}</span>
                {delta !== 0 && (
                  <span className={delta > 0 ? "text-azure" : "text-amber-bright"}>
                    {" "}
                    ({delta > 0 ? "+" : ""}
                    {delta})
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
