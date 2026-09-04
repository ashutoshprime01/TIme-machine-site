// Deterministic change detection between two snapshot analyses (plan §13–14).
// All percentages are INTERNAL COMPARISON METRICS — heuristic, not objective
// measures of cultural change (plan §14). Facts and inferences are labeled
// separately per plan §2 and §19.

import type {
  ComparisonResult,
  DetectedChange,
  SnapshotMetrics,
} from "@/lib/types";

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/** Relative change between two counts, as a 0–100 saturation. */
function changeScore(a: number, b: number, scale: number): number {
  if (a === 0 && b === 0) return 0;
  const diff = Math.abs(b - a);
  const base = Math.max(a, b, 1);
  return clamp((diff / base) * 100 * scale);
}

function weightedMean(parts: Array<[number, number]>): number {
  const totalWeight = parts.reduce((s, [, w]) => s + w, 0);
  return parts.reduce((s, [v, w]) => s + v * w, 0) / totalWeight;
}

function jaccardDistance(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const x of setA) if (setB.has(x)) intersection += 1;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : 1 - intersection / union;
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

export function compareMetrics(
  a: SnapshotMetrics,
  b: SnapshotMetrics,
  labelA: string,
  labelB: string
): ComparisonResult {
  // --- aggregate dimension scores (internal metrics) ---
  const contentChange = weightedMean([
    [changeScore(a.wordCount, b.wordCount, 1), 0.3],
    [changeScore(a.headingCount, b.headingCount, 1), 0.15],
    [changeScore(a.linkCount, b.linkCount, 1), 0.2],
    [changeScore(a.imageCount, b.imageCount, 1), 0.2],
    [changeScore(a.paragraphCount, b.paragraphCount, 1), 0.15],
  ]);

  const structureChange = weightedMean([
    [changeScore(a.domNodes, b.domNodes, 1), 0.4],
    [changeScore(a.domDepth, b.domDepth, 1), 0.2],
    [changeScore(a.tableCount, b.tableCount, 1), 0.2],
    [changeScore(a.listCount, b.listCount, 1), 0.2],
  ]);

  const navigationChange = weightedMean([
    [changeScore(a.navLinks, b.navLinks, 1), 0.6],
    [changeScore(a.navRegions, b.navRegions, 1), 0.4],
  ]);

  const technologyChange = clamp(
    jaccardDistance(
      a.techSignals.map((t) => t.name),
      b.techSignals.map((t) => t.name)
    ) * 100
  );

  const evolutionIndex = Math.round(
    weightedMean([
      [contentChange, 0.3],
      [structureChange, 0.25],
      [navigationChange, 0.15],
      [technologyChange, 0.3],
    ])
  );

  // --- detected changes (FACT: direct observations) ---
  const detected: DetectedChange[] = [];
  const fact = (text: string) => detected.push({ status: "FACT", text });

  if (changeScore(a.wordCount, b.wordCount, 1) > 40)
    fact(`Text volume changed from ${fmtNum(a.wordCount)} to ${fmtNum(b.wordCount)} words.`);
  if (changeScore(a.imageCount, b.imageCount, 1) > 40)
    fact(`Image count changed from ${fmtNum(a.imageCount)} to ${fmtNum(b.imageCount)}.`);
  if (changeScore(a.linkCount, b.linkCount, 1) > 40)
    fact(`Link count changed from ${fmtNum(a.linkCount)} to ${fmtNum(b.linkCount)}.`);
  if (changeScore(a.domNodes, b.domNodes, 1) > 40)
    fact(`Page structure changed from ${fmtNum(a.domNodes)} to ${fmtNum(b.domNodes)} DOM elements.`);
  if (changeScore(a.navLinks, b.navLinks, 1) > 40)
    fact(`Navigation links changed from ${fmtNum(a.navLinks)} to ${fmtNum(b.navLinks)}.`);
  if (changeScore(a.tableCount, b.tableCount, 1) > 40 && a.tableCount > b.tableCount)
    fact(`Table-based layout appears to have been abandoned (${fmtNum(a.tableCount)} → ${fmtNum(b.tableCount)} tables).`);

  const gained = b.techSignals
    .map((t) => t.name)
    .filter((n) => !a.techSignals.some((t) => t.name === n));
  const lost = a.techSignals
    .map((t) => t.name)
    .filter((n) => !b.techSignals.some((t) => t.name === n));
  if (gained.length)
    fact(`Technologies appearing in ${labelB} but not ${labelA}: ${gained.join(", ")}.`);
  if (lost.length)
    fact(`Technologies present in ${labelA} but not ${labelB}: ${lost.join(", ")}.`);

  // --- interpretations (INFERENCE: derived from evidence) ---
  const infer = (text: string) => detected.push({ status: "INFERENCE", text });

  const mediaDelta = b.imageCount + b.videoCount * 5 - (a.imageCount + a.videoCount * 5);
  if (mediaDelta > 15)
    infer("The site appears to have become considerably more media-oriented.");
  else if (mediaDelta < -15)
    infer("The site appears to have become more text-focused, with fewer visual elements.");

  if (b.navLinks > a.navLinks * 1.5 && a.navLinks > 0)
    infer("Navigation appears to have expanded substantially.");
  else if (a.navLinks > b.navLinks * 1.5 && b.navLinks > 0)
    infer("Navigation appears to have been simplified.");

  if (
    b.techSignals.some((t) => t.name === "Mobile viewport") &&
    !a.techSignals.some((t) => t.name === "Mobile viewport")
  )
    infer("The site appears to have adopted mobile-aware / responsive design between these captures.");

  if (
    b.textSignals.commerce > a.textSignals.commerce * 2 &&
    b.textSignals.commerce > 5
  )
    infer("The site appears to have become more commercially oriented.");

  if (
    b.textSignals.ai > 0 && a.textSignals.ai === 0
  )
    infer("AI-oriented features appear to have been introduced.");

  return {
    contentChange: Math.round(contentChange),
    structureChange: Math.round(structureChange),
    navigationChange: Math.round(navigationChange),
    technologyChange: Math.round(technologyChange),
    evolutionIndex,
    detectedChanges: detected,
  };
}
