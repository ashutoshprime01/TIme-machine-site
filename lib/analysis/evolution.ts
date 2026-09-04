// Evolution Engine (plan §17–19, §46): deterministic era analysis.
//
// One representative capture per year is analyzed (results persist in the DB,
// so this is expensive only the first time). Adjacent years are compared; a
// large change becomes a candidate event — called a "Detected change", never
// automatically a "redesign", until evidence is sufficient (plan §19).

import { prisma } from "@/lib/db";
import { archive } from "@/lib/archive";
import { analyzeCapture } from "@/lib/analysis/service";
import { compareMetrics } from "@/lib/analysis/compare";
import type { ComparisonResult, DetectedChange, DnaProfile, SnapshotMetrics } from "@/lib/types";
import { logger } from "@/lib/logger";

/** A change dimension at or above this becomes a candidate event. */
const EVENT_THRESHOLD = 35;
const HIGH_CONFIDENCE = 60;

/**
 * How long a failed year analysis is remembered before it is retried.
 * Without this, a flaky archive makes every page view slow (each visit
 * re-attempts every failed year). Failures are transient, so the TTL is short.
 */
const FAILURE_TTL_MS = 10 * 60 * 1000;

const analysisFailures = new Map<string, number>();

export type EventType = "content" | "structure" | "navigation" | "technology";

export interface EvolutionEvent {
  yearA: string;
  yearB: string;
  timestampA: string;
  timestampB: string;
  type: EventType;
  confidence: "high" | "medium";
  magnitude: number;
  changes: DetectedChange[];
}

export interface YearPoint {
  year: string;
  timestamp: string;
  metrics: SnapshotMetrics;
  dna: DnaProfile;
}

export interface EvolutionReport {
  points: YearPoint[];
  events: EvolutionEvent[];
  /** Overall change from the earliest to the latest analyzed capture. */
  overallIndex: number | null;
  overallComparison: ComparisonResult | null;
  /** False when some year analyses failed and were skipped. */
  complete: boolean;
}

/** Pick the capture of a year closest to mid-year (a representative sample). */
function representativeCapture(year: string, captures: { timestamp: string }[]): string | null {
  const target = `${year}0701`;
  let best: string | null = null;
  let bestDist = Infinity;
  for (const c of captures) {
    const dist = Math.abs(Number(c.timestamp.slice(0, 8)) - Number(target));
    if (dist < bestDist) {
      bestDist = dist;
      best = c.timestamp;
    }
  }
  return best;
}

function dominantDimension(comparison: ComparisonResult): {
  type: EventType;
  magnitude: number;
} {
  const candidates: Array<[EventType, number]> = [
    ["technology", comparison.technologyChange],
    ["content", comparison.contentChange],
    ["structure", comparison.structureChange],
    ["navigation", comparison.navigationChange],
  ];
  candidates.sort((a, b) => b[1] - a[1]);
  return { type: candidates[0][0], magnitude: candidates[0][1] };
}

/** Analyze one representative capture per year and detect events. */
export async function buildEvolutionReport(domain: string): Promise<EvolutionReport> {
  const captures = await archive.searchCaptures(domain);
  if (captures.length === 0) {
    return { points: [], events: [], overallIndex: null, overallComparison: null, complete: true };
  }

  // Group by year, then pick each year's representative capture.
  const byYear = new Map<string, string[]>();
  for (const c of captures) {
    const y = c.timestamp.slice(0, 4);
    (byYear.get(y) ?? byYear.set(y, []).get(y)!).push(c.timestamp);
  }
  const yearSamples = [...byYear.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, list]) => ({ year, timestamp: representativeCapture(year, list.map((t) => ({ timestamp: t })))! }))
    .filter((s) => s.timestamp);

  // Analyses run through the archive limiter; failures skip that year and
  // are remembered for a few minutes so page views stay fast.
  const settled = await Promise.allSettled(
    yearSamples.map(async (s) => {
      const key = `${domain}:${s.timestamp}`;
      const failedAt = analysisFailures.get(key);
      if (failedAt !== undefined && Date.now() - failedAt < FAILURE_TTL_MS) {
        throw new Error("recently failed, not retried yet");
      }
      try {
        const result = await analyzeCapture(domain, s.timestamp);
        analysisFailures.delete(key);
        return result;
      } catch (err) {
        analysisFailures.set(key, Date.now());
        throw err;
      }
    })
  );

  const points: YearPoint[] = [];
  let failed = 0;
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    if (r.status === "fulfilled") {
      points.push({
        year: yearSamples[i].year,
        timestamp: r.value.capture.timestamp,
        metrics: r.value.analysis.metrics,
        dna: r.value.analysis.dna,
      });
    } else {
      failed += 1;
      logger.warn("evolution: year analysis failed", {
        domain,
        year: yearSamples[i].year,
        err: String(r.reason),
      });
    }
  }

  // Adjacent-year comparisons → candidate events.
  const events: EvolutionEvent[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const comparison = compareMetrics(a.metrics, b.metrics, a.year, b.year);
    const { type, magnitude } = dominantDimension(comparison);
    if (magnitude >= EVENT_THRESHOLD) {
      events.push({
        yearA: a.year,
        yearB: b.year,
        timestampA: a.timestamp,
        timestampB: b.timestamp,
        type,
        confidence: magnitude >= HIGH_CONFIDENCE ? "high" : "medium",
        magnitude,
        changes: comparison.detectedChanges,
      });
    }
  }

  // Overall evolution: earliest vs latest analyzed capture.
  let overallComparison: ComparisonResult | null = null;
  if (points.length >= 2) {
    const first = points[0];
    const last = points[points.length - 1];
    overallComparison = compareMetrics(first.metrics, last.metrics, first.year, last.year);
  }

  await persistEvents(domain, events);

  return {
    points,
    events,
    overallIndex: overallComparison?.evolutionIndex ?? null,
    overallComparison,
    complete: failed === 0,
  };
}

/** Store detected events (plan §19: Create candidate event → Store event). */
async function persistEvents(domain: string, events: EvolutionEvent[]): Promise<void> {
  try {
    const entity = await prisma.entity.findUnique({ where: { domain } });
    if (!entity) return;
    // Deterministic output — regenerate rather than accumulate.
    await prisma.timelineEvent.deleteMany({ where: { entityId: entity.id } });
    if (events.length === 0) return;
    await prisma.timelineEvent.createMany({
      data: events.map((e) => ({
        entityId: entity.id,
        snapshotA: e.timestampA,
        snapshotB: e.timestampB,
        type: e.type,
        confidence: e.confidence,
        magnitude: e.magnitude,
        evidence: JSON.stringify(e.changes),
      })),
    });
  } catch (err) {
    // Event storage is an audit trail, not a critical path.
    logger.warn("evolution: event persistence failed", { domain, err: String(err) });
  }
}
