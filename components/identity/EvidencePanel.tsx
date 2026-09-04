// Evidence panel — the inspectable core of Identity History (master prompt,
// SOURCE EVIDENCE): every discovery exposes SOURCE, DATE, URL, EVIDENCE and
// CONFIDENCE, plus a route to report or request removal of the result.

import Link from "next/link";
import type { EvidenceBundle } from "@/lib/types";
import { ConfidenceBadge } from "./ConfidenceBadge";

export function EvidencePanel({
  evidence,
  source,
  confidence,
  reportContext,
}: {
  evidence: EvidenceBundle;
  /** The trace's source line (may differ from evidence.source). */
  source: string;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "UNVERIFIED";
  /** Context prefilled into the report form. */
  reportContext: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-bright/90">
          {evidence.label}
        </span>
        <ConfidenceBadge level={confidence} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-mist">{evidence.reason}</p>

      <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 font-mono text-[11px]">
        <div className="flex gap-2">
          <dt className="uppercase tracking-[0.16em] text-faint">Source</dt>
          <dd className="text-mist">{source}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="uppercase tracking-[0.16em] text-faint">Date</dt>
          <dd className="text-mist">{evidence.date || "—"}</dd>
        </div>
      </dl>

      {evidence.signals.length > 0 && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          Signals: {evidence.signals.join(" · ")}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <a
          href={evidence.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-xs text-azure hover:text-azure/80 underline decoration-azure/40 underline-offset-4 transition-colors"
        >
          View evidence ↗
        </a>
        <Link
          href={`/report?context=${encodeURIComponent(reportContext)}`}
          className="text-xs text-faint hover:text-mist underline decoration-white/20 underline-offset-4 transition-colors"
        >
          Report / remove this result
        </Link>
      </div>
    </div>
  );
}
