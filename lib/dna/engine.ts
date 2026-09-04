// Internet DNA scoring — deterministic heuristics (plan §15–16).
//
// These are ANALYTICAL HEURISTICS, not objective cultural truth. Every score
// is a fixed function of measured snapshot metrics and is versioned
// (DNA_VERSION) so historical analyses stay reproducible (plan §69–70).

import type { DnaProfile, SnapshotMetrics } from "@/lib/types";
import { DNA_VERSION } from "@/lib/types";

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/** log-scaled DOM complexity: 100 nodes ≈ 50, 1 000 ≈ 75, 10 000 ≈ 100 */
function nodeComplexity(domNodes: number): number {
  return clamp(Math.log10(Math.max(domNodes, 1)) * 25);
}

function colorComplexity(distinctColors: number): number {
  return clamp(distinctColors * 8);
}

function mediaComplexity(m: SnapshotMetrics): number {
  return clamp(m.imageCount * 2.5 + m.videoCount * 12);
}

function countSignals(text: string, patterns: RegExp[]): number {
  return patterns.reduce((sum, re) => sum + (text.match(re)?.length ?? 0), 0);
}

export function computeDna(m: SnapshotMetrics): DnaProfile {
  const nodeC = nodeComplexity(m.domNodes);
  const colorC = colorComplexity(m.distinctColors);
  const mediaC = mediaComplexity(m);

  const tech = (name: string) => m.techSignals.some((t) => t.name === name);
  const techIn = (category: string) =>
    m.techSignals.filter((t) => t.category === category).length;

  // Minimalism: few elements, few colors, little media.
  const minimalism = clamp(100 - 0.45 * nodeC - 0.35 * colorC - 0.2 * mediaC);

  // Information density: words per element + absolute text volume.
  const wordsPerNode = m.wordCount / Math.max(m.domNodes / 100, 1);
  const informationDensity = clamp(Math.min(wordsPerNode / 6, 100) * 0.75 + Math.min(m.wordCount / 1500, 100) * 0.25);

  // Visual complexity: structure + palette + media.
  const visualComplexity = clamp(0.4 * nodeC + 0.3 * colorC + 0.3 * mediaC);

  // Commercialization (plan §16): transactional wording + forms + ads.
  const commercialization = clamp(
    Math.min(m.textSignals.commerce * 6, 45) +
      Math.min(m.formCount * 6, 18) +
      (tech("Online advertising") ? 25 : 0) +
      (m.pageSizeBytes > 400_000 ? 10 : 0)
  );

  // Social intensity: share/follow/community wording + social widgets.
  const socialIntensity = clamp(
    Math.min(m.textSignals.social * 7, 50) +
      (tech("Social widgets") ? 35 : 0) +
      Math.min(m.videoCount * 5, 15)
  );

  // Personalization: sign-in/account/recommendation wording + forms + analytics.
  const personalization = clamp(
    Math.min(m.textSignals.personal * 8, 40) +
      Math.min(m.formCount * 8, 25) +
      (tech("Google Analytics") || tech("Web analytics") ? 20 : 0) +
      Math.min(m.videoCount * 3, 15)
  );

  // Interactivity: scripts, forms, media players.
  const interactivity = clamp(
    Math.min(techIn("javascript") * 15 + (m.techSignals.length ? 10 : 0), 50) +
      Math.min(m.formCount * 10, 25) +
      Math.min(m.videoCount * 8, 25)
  );

  // Mobile focus (plan §16: measurable signals).
  const mobileFocus = clamp(
    (m.techSignals.some((t) => t.name === "Mobile viewport") ? 50 : 0) +
      (tech("Responsive design") ? 35 : 0) +
      (tech("Web fonts") ? 10 : 0) +
      (m.tableCount === 0 ? 5 : 0)
  );

  // Media intensity (plan §16: weighted images + videos + embeds).
  const mediaIntensity = clamp(m.imageCount * 3 + m.videoCount * 15);

  // AI integration.
  const aiIntegration = clamp(m.textSignals.ai * 20 + (tech("AI features") ? 50 : 0));

  // Accessibility signals: heading structure, semantic markup, layout era.
  const accessibilitySignals = clamp(
    clamp(m.headingCount * 5, 25) +
      (tech("HTML5 doctype") ? 25 : 0) +
      (m.tableCount === 0 ? 15 : 0) +
      Math.min(m.navRegions * 10, 20)
  );

  // Navigation complexity (plan §16).
  const navigationComplexity = clamp(
    Math.min(m.navLinks * 2, 55) + Math.min(m.navRegions * 15, 30) + Math.min(m.listCount * 2, 15)
  );

  return {
    minimalism: Math.round(minimalism),
    informationDensity: Math.round(informationDensity),
    visualComplexity: Math.round(visualComplexity),
    socialIntensity: Math.round(socialIntensity),
    commercialization: Math.round(commercialization),
    personalization: Math.round(personalization),
    mobileFocus: Math.round(mobileFocus),
    interactivity: Math.round(interactivity),
    mediaIntensity: Math.round(mediaIntensity),
    aiIntegration: Math.round(aiIntegration),
    accessibilitySignals: Math.round(accessibilitySignals),
    navigationComplexity: Math.round(navigationComplexity),
    algorithmVersion: DNA_VERSION,
  };
}

export { DNA_VERSION };
