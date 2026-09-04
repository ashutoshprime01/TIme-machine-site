// Future Mode engine (plan §24, §49): scenario extrapolation.
//
// Deterministic and grounded: each DNA dimension is extrapolated from the
// site's *measured* first→last trend (points per year from the Evolution
// Engine), scaled by the years ahead and modulated by the scenario's
// philosophy. Everything produced here is HYPOTHESIS (speculation) — the
// plan forbids presenting future output as fact or prediction.

import type { DnaProfile } from "@/lib/types";

export const FUTURE_VERSION = "1.0";

export type ScenarioId =
  | "conservative"
  | "mainstream"
  | "radical"
  | "ai-native"
  | "minimalist"
  | "community-driven";

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  /** Multiplier on the measured trend per dimension (dampens or amplifies). */
  philosophy: string;
}

export const SCENARIOS: Scenario[] = [
  { id: "conservative", label: "Conservative", description: "The site changes as little as possible — maintenance only, trends dampen toward zero.", philosophy: "Preserve what exists; adopt only what is unavoidable." },
  { id: "mainstream", label: "Mainstream", description: "The measured trend continues at the same pace it has so far.", philosophy: "Keep evolving the way the web at large evolves." },
  { id: "radical", label: "Radical", description: "Change accelerates well beyond the current pace.", philosophy: "Reinvent aggressively; assume breakthroughs compound." },
  { id: "ai-native", label: "AI-native", description: "AI assistants become primary users and co-creators of the site.", philosophy: "Conversational first; pages assemble per visitor." },
  { id: "minimalist", label: "Minimalist", description: "The web pushes back on complexity; the site strips down.", philosophy: "Less, forever. Content over chrome." },
  { id: "community-driven", label: "Community-driven", description: "Community contribution and federation shape the site.", philosophy: "The visitors are the authors." },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export const TARGET_YEARS = [2030, 2035, 2040] as const;

type DnaDimension = keyof Omit<DnaProfile, "algorithmVersion">;

// Scenario → multiplier on each dimension's measured trend, plus how each of
// the plan's four facets (navigation/content/interface/search) is described.
const MODULATION: Record<ScenarioId, Partial<Record<DnaDimension, number>>> = {
  conservative: { mobileFocus: 0.4, mediaIntensity: 0.2, visualComplexity: 0.1, aiIntegration: 0.3, commercialization: 0.2, navigationComplexity: 0.1, informationDensity: 0.1, interactivity: 0.2, minimalism: 0.3 },
  mainstream: {},
  radical: { mobileFocus: 1.8, interactivity: 2, mediaIntensity: 2, visualComplexity: 2, commercialization: 1.5, personalization: 2, aiIntegration: 2, informationDensity: 1.5, minimalism: -1 },
  "ai-native": { aiIntegration: 3, personalization: 2.5, interactivity: 1.5, informationDensity: 0.5, navigationComplexity: -2, minimalism: 1 },
  minimalist: { minimalism: 2.5, navigationComplexity: -2.5, visualComplexity: -2, mediaIntensity: -1.5, informationDensity: -0.5, interactivity: -0.5, commercialization: -1 },
  "community-driven": { socialIntensity: 3, interactivity: 2, personalization: 1, informationDensity: 0.5, commercialization: -0.5 },
};

const FACETS: Record<ScenarioId, { navigation: string; content: string; interface: string; search: string }> = {
  conservative: { navigation: "Unchanged — today's structure, maintained", content: "Updated, same shape", interface: "Refined, familiar", search: "Site search as today" },
  mainstream: { navigation: "Responsive menus, deeper hierarchy", content: "Richer media, more dynamic", interface: "Adaptive to device, still page-shaped", search: "Assisted keyword search" },
  radical: { navigation: "Spatial / infinite-canvas navigation", content: "Generated and multimedia-first", interface: "3D/immersive, app-like", search: "Intent-based, predictive" },
  "ai-native": { navigation: "Conversational", content: "Personalized", interface: "Adaptive", search: "Contextual" },
  minimalist: { navigation: "One page, a handful of links", content: "Text-first, timeless", interface: "Static, instant, permanent", search: "The page is small enough to read" },
  "community-driven": { navigation: "Community-curated paths", content: "Contributed and versioned", interface: "Wiki-like, editable", search: "People, not queries" },
};

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export interface TrendInput {
  /** Earliest measured DNA profile. */
  first: Omit<DnaProfile, "algorithmVersion">;
  /** Latest measured DNA profile. */
  last: Omit<DnaProfile, "algorithmVersion">;
  firstYear: number;
  lastYear: number;
}

export interface FutureResult {
  scenario: ScenarioId;
  scenarioLabel: string;
  targetYear: number;
  /** Extrapolated DNA, 0–100. HYPOTHESIS. */
  dna: Omit<DnaProfile, "algorithmVersion">;
  /** The four facets from plan §24's example. */
  facets: { navigation: string; content: string; interface: string; search: string };
  /** Assumptions the extrapolation rests on (plan §49 assumptions). */
  assumptions: string[];
  /** Human-readable trend grounding: measured first→last values. */
  trendGrounding: string[];
  futureVersion: string;
}

/**
 * Extrapolate the site's measured DNA trend to a target year under a
 * scenario. Deterministic: same inputs → same output (Future v1.0).
 */
export function buildFutureScenario(
  scenarioId: ScenarioId,
  targetYear: number,
  trend: TrendInput
): FutureResult {
  const scenario = getScenario(scenarioId)!;
  const modulation = MODULATION[scenarioId];

  const span = Math.max(1, trend.lastYear - trend.firstYear);
  const yearsAhead = Math.max(1, targetYear - trend.lastYear);

  const dimensions = Object.keys(trend.last) as Array<DnaDimension>;
  const dna = { ...trend.last } as Omit<DnaProfile, "algorithmVersion">;
  const grounding: string[] = [];

  for (const dim of dimensions) {
    const measured = (trend.last[dim] - trend.first[dim]) / span; // units/year
    const factor = modulation[dim] ?? 1;
    const projected = trend.last[dim] + measured * factor * yearsAhead;
    dna[dim] = clamp(projected);
    if (Math.abs(measured) >= 0.5) {
      grounding.push(
        `${LABELS[dim]}: ${trend.first[dim]} (${trend.firstYear}) → ${trend.last[dim]} (${trend.lastYear}), measured ${measured > 0 ? "+" : ""}${measured.toFixed(1)}/yr`
      );
    }
  }

  // Scenario floors/ceilings that no trend should violate.
  if (scenarioId === "ai-native") dna.aiIntegration = Math.max(dna.aiIntegration, 55);
  if (scenarioId === "minimalist") dna.minimalism = Math.max(dna.minimalism, 60);
  if (scenarioId === "community-driven") dna.socialIntensity = Math.max(dna.socialIntensity, 50);
  if (scenarioId === "conservative") {
    // Drift back toward the latest real values — barely moves at all.
    for (const dim of dimensions) {
      dna[dim] = clamp(trend.last[dim] + (dna[dim] - trend.last[dim]) * 0.25);
    }
  }

  const facets = FACETS[scenarioId];

  const assumptions = [
    `The ${trend.firstYear}–${trend.lastYear} measured trajectory is a meaningful basis at all (the past often is not).`,
    `The ${scenario.label.toLowerCase()} philosophy (${scenario.philosophy}) takes hold of the web this site lives in.`,
    `No discontinuity — no shutdown, redesign from zero, or acquisition resets the trajectory.`,
    `DNA dimensions stay a useful vocabulary for describing websites in ${targetYear}.`,
  ];
  if (grounding.length === 0) {
    assumptions.push(
      "The site barely changed during its measured history, so this extrapolation starts from a nearly flat trend — read it as scenario philosophy applied to a static base, not as momentum."
    );
  }

  return {
    scenario: scenarioId,
    scenarioLabel: scenario.label,
    targetYear,
    dna,
    facets,
    assumptions,
    trendGrounding: grounding,
    futureVersion: FUTURE_VERSION,
  };
}

const LABELS: Record<DnaDimension, string> = {
  minimalism: "Minimalism",
  informationDensity: "Information density",
  visualComplexity: "Visual complexity",
  socialIntensity: "Social intensity",
  commercialization: "Commercialization",
  personalization: "Personalization",
  mobileFocus: "Mobile focus",
  interactivity: "Interactivity",
  mediaIntensity: "Media intensity",
  aiIntegration: "AI integration",
  accessibilitySignals: "Accessibility signals",
  navigationComplexity: "Navigation complexity",
};
