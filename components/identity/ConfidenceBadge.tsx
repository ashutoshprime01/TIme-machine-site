// Confidence badges — ITM 2.0's evidence grading. Every trace and every
// identity grouping carries one of HIGH / MEDIUM / LOW / UNVERIFIED.

import type { ConfidenceLevel } from "@/lib/types";

const STYLES: Record<ConfidenceLevel, string> = {
  HIGH: "border-amber-bright/50 bg-amber-bright/10 text-amber-bright",
  MEDIUM: "border-amber/40 bg-amber/10 text-amber-bright/90",
  LOW: "border-white/20 bg-white/5 text-mist",
  UNVERIFIED: "border-white/15 bg-white/5 text-faint",
};

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${STYLES[level]}`}
      title={`Evidence confidence: ${level}`}
    >
      {level}
    </span>
  );
}
