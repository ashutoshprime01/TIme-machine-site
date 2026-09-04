// Evolution Lab engine (plan §20–21, §48): deterministic transformations.
//
// No AI. Each mode takes the *measured* metrics and DNA of a real snapshot
// and produces a hypothetical result — adjusted DNA dimensions plus concrete,
// grounded transformations and recommendations derived from the actual
// numbers (e.g. "navigation reduced from 23 links to ~8"). Every output is
// HYPOTHETICAL — never presented as history (plan §2, §20).

import type { DnaDimensions, DnaProfile, SnapshotMetrics } from "@/lib/types";

export const LAB_VERSION = "1.0";

export type LabModeId =
  | "modernize"
  | "mobile-first"
  | "simplify"
  | "accessibility-first"
  | "commercialize"
  | "ai-native"
  | "preserve-philosophy";

export interface LabMode {
  id: LabModeId;
  label: string;
  description: string;
}

export const LAB_MODES: LabMode[] = [
  { id: "modernize", label: "Modernize", description: "A contemporary rebuild: responsive layout, richer media, more interaction — the way sites typically evolved." },
  { id: "mobile-first", label: "Mobile-first", description: "Rebuilt for phones: single column, simplified navigation, larger touch targets." },
  { id: "simplify", label: "Simplify", description: "Stripped to essentials: fewer sections, fewer links, less visual noise." },
  { id: "accessibility-first", label: "Accessibility-first", description: "Rebuilt around accessibility: semantic structure, hierarchy, contrast discipline." },
  { id: "commercialize", label: "Commercialize", description: "Turned into a business: pricing, accounts, calls to action, personalization." },
  { id: "ai-native", label: "AI-native", description: "Rebuilt as if AI assistants were the primary users and co-creators." },
  { id: "preserve-philosophy", label: "Preserve philosophy", description: "Counterfactual: the site keeps its original design philosophy and evolves only minimally." },
];

export function getLabMode(id: string): LabMode | undefined {
  return LAB_MODES.find((m) => m.id === id);
}

export interface LabTransformation {
  status: "HYPOTHESIS";
  text: string;
}

export interface LabResult {
  mode: LabModeId;
  modeLabel: string;
  /** Hypothetical DNA of the transformed site (0–100 per dimension). */
  dna: DnaDimensions & { algorithmVersion: string };
  /** Grounded, deterministic transformation statements. */
  transformations: LabTransformation[];
  /** Mode-specific checklist items derived from the real measurements. */
  recommendations: string[];
  labVersion: string;
}

type Dims = Omit<DnaProfile, "algorithmVersion">;

/** Each mode: how each DNA dimension moves relative to the source. */
const DELTAS: Record<LabModeId, Partial<Record<keyof Dims, number>>> = {
  modernize: {
    mobileFocus: 40,
    interactivity: 25,
    mediaIntensity: 20,
    visualComplexity: 15,
    accessibilitySignals: 10,
    informationDensity: 10,
    minimalism: -10,
  },
  "mobile-first": {
    mobileFocus: 50,
    navigationComplexity: -30,
    minimalism: 15,
    interactivity: 15,
    visualComplexity: -10,
    mediaIntensity: -10,
    accessibilitySignals: 10,
  },
  simplify: {
    minimalism: 30,
    navigationComplexity: -30,
    informationDensity: -25,
    visualComplexity: -20,
    mediaIntensity: -20,
    interactivity: -10,
    accessibilitySignals: 15,
  },
  "accessibility-first": {
    accessibilitySignals: 40,
    visualComplexity: -15,
    minimalism: 10,
    navigationComplexity: -10,
    interactivity: 5,
    mediaIntensity: -5,
  },
  commercialize: {
    commercialization: 35,
    interactivity: 20,
    personalization: 15,
    visualComplexity: 10,
    minimalism: -15,
  },
  "ai-native": {
    aiIntegration: 50,
    personalization: 30,
    interactivity: 20,
    informationDensity: 10,
    minimalism: -5,
  },
  // Counterfactual: philosophy preserved — only minimal drift.
  "preserve-philosophy": {},
};

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** Estimated post-transformation value, rounded to something reportable. */
function estimate(current: number, factor: number, min = 0): number {
  const raw = Math.max(min, Math.round(current * factor));
  if (raw >= 100) return Math.round(raw / 10) * 10;
  if (raw >= 20) return Math.round(raw / 5) * 5;
  return raw;
}

/**
 * Apply a deterministic transformation to a real analyzed snapshot.
 * Same inputs always produce the same result (Lab v1.0).
 */
export function applyTransformation(
  modeId: LabModeId,
  metrics: SnapshotMetrics,
  sourceDna: DnaProfile
): LabResult {
  const mode = getLabMode(modeId)!;
  const deltas = DELTAS[modeId];

  const dna: Dims & { algorithmVersion: string } = { ...sourceDna };
  for (const key of Object.keys(deltas) as Array<keyof Dims>) {
    const drift = modeId === "preserve-philosophy" ? 2 : (deltas[key] ?? 0);
    dna[key] = clamp(sourceDna[key] + drift);
  }
  if (modeId === "mobile-first") dna.mobileFocus = Math.max(dna.mobileFocus, 90);
  if (modeId === "ai-native") dna.aiIntegration = Math.max(dna.aiIntegration, 60);
  if (modeId === "accessibility-first") dna.accessibilitySignals = Math.max(dna.accessibilitySignals, 55);
  if (modeId === "commercialize") dna.commercialization = Math.max(dna.commercialization, 50);
  dna.algorithmVersion = LAB_VERSION;

  const t: LabTransformation[] = [];
  const rec: string[] = [];

  if (modeId === "modernize") {
    t.push({ status: "HYPOTHESIS", text: `Fixed-width layout becomes responsive; the ${estimate(metrics.domNodes, 1.4)} estimated elements reflow into fluid grids instead of today's ${metrics.domNodes}.` });
    t.push({ status: "HYPOTHESIS", text: `Media grows from ${metrics.imageCount} images to roughly ${estimate(metrics.imageCount, 2.2)} with video and responsive variants.` });
    t.push({ status: "HYPOTHESIS", text: `Static links become interactive components — forms, menus and dynamic widgets lift interactivity.` });
    rec.push("Navigation becomes a responsive menu — a single pattern across phone, tablet and desktop.");
    rec.push("Add fluid images (srcset) and lazy loading.");
    rec.push("Progressive enhancement so the page still works when scripts fail.");
  }

  if (modeId === "mobile-first") {
    const navAfter = Math.max(4, Math.round(metrics.navLinks * 0.35));
    t.push({ status: "HYPOTHESIS", text: `Layout becomes single-column; sidebars and secondary regions are dropped.` });
    t.push({ status: "HYPOTHESIS", text: `Navigation compresses from ${metrics.navLinks} links to ~${navAfter} behind a hamburger menu.` });
    t.push({ status: "HYPOTHESIS", text: `Touch targets grow to a 44px minimum; tap spacing replaces dense link lists.` });
    rec.push("Test on a real phone, not just a narrowed desktop window.");
    rec.push("Content parity: everything reachable on desktop stays reachable on mobile.");
    rec.push("Reduce page weight — mobile connections pay per kilobyte.");
  }

  if (modeId === "simplify") {
    const linksAfter = Math.max(5, Math.round(metrics.linkCount * 0.4));
    t.push({ status: "HYPOTHESIS", text: `Links drop from ${metrics.linkCount} to ~${linksAfter} — low-priority and duplicate navigation removed.` });
    t.push({ status: "HYPOTHESIS", text: `Sections shrink from ${metrics.paragraphCount} paragraphs of ${metrics.wordCount} words to a focused ~${Math.max(30, Math.round(metrics.wordCount * 0.45))} words.` });
    t.push({ status: "HYPOTHESIS", text: `DOM elements fall from ${metrics.domNodes} to ~${estimate(metrics.domNodes, 0.5)} as decorative structure is removed.` });
    rec.push("Rank every element: does removing it lose meaning? If not, remove it.");
    rec.push("One primary action per screen.");
  }

  if (modeId === "accessibility-first") {
    t.push({ status: "HYPOTHESIS", text: `Heading structure becomes a strict hierarchy (today: ${metrics.headingCount} headings, order unverified).` });
    t.push({ status: "HYPOTHESIS", text: `All ${metrics.imageCount} images gain meaningful alt text or are marked decorative.` });
    t.push({ status: "HYPOTHESIS", text: `Navigation becomes a semantic <nav> landmark (${metrics.navRegions} nav regions measured today).` });
    rec.push("Audit color contrast on all text — automated checks catch only part of it.");
    rec.push("Keyboard-only walkthrough: can every control be reached and operated?");
    rec.push("Respect prefers-reduced-motion and prefers-color-scheme.");
  }

  if (modeId === "commercialize") {
    t.push({ status: "HYPOTHESIS", text: `Pricing, sign-up and checkout flows appear — forms grow from ${metrics.formCount} to a multi-step funnel.` });
    t.push({ status: "HYPOTHESIS", text: `Calls to action replace plain links; commercial wording joins the copy (today: ${metrics.textSignals.commerce} commerce signals measured).` });
    t.push({ status: "HYPOTHESIS", text: `Accounts and personalization infrastructure are added, increasing page weight beyond ${Math.round(metrics.pageSizeBytes / 1024)} KB.` });
    rec.push("Keep the fast, anonymous experience — paywalls and walls slow every metric down.");
    rec.push("A purchase path that needs no account converts better.");
  }

  if (modeId === "ai-native") {
    t.push({ status: "HYPOTHESIS", text: `The page becomes a conversation: an assistant answers questions instead of visitors scanning ${metrics.wordCount} words.` });
    t.push({ status: "HYPOTHESIS", text: `Content is generated per visitor — the ${metrics.headingCount}-heading structure becomes dynamic, assembled on request.` });
    t.push({ status: "HYPOTHESIS", text: `Agentic visitors (crawlers, assistants) get machine-readable versions alongside the human page.` });
    rec.push("Deterministic fallbacks for every generated answer — hallucination is a product bug.");
    rec.push("Let users see and edit what the system knows about them.");
  }

  if (modeId === "preserve-philosophy") {
    t.push({ status: "HYPOTHESIS", text: `The site keeps its ${sourceDna.minimalism >= 50 ? "minimal, content-first" : "original structural"} design philosophy instead of following web fashion.` });
    t.push({ status: "HYPOTHESIS", text: `Page weight stays near ${Math.round(metrics.pageSizeBytes / 1024)} KB; DOM near ${metrics.domNodes} elements; no tracking or framework churn.` });
    t.push({ status: "HYPOTHESIS", text: `Only maintenance updates: link repair, protocol changes, occasional content refresh.` });
    rec.push("Compare this against the real timeline to see what the site actually chose instead.");
    rec.push("Philosophy-preservation is an assumption, not a prediction — label every use of this result accordingly.");
  }

  return {
    mode: modeId,
    modeLabel: mode.label,
    dna,
    transformations: t,
    recommendations: rec,
    labVersion: LAB_VERSION,
  };
}
