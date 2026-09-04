// Confidence scoring (master prompt, CONFIDENCE SYSTEM).
//
// This is a *heuristic, not proof*. It scores how much public evidence
// supports grouping traces under one candidate identity — it never claims
// two accounts belong to the same person.
//
//   Exact username match:            +2
//   Same linked website:             +3
//   Same public profile reference:   +2
//   Consistent timeline:             +1
//   Conflicting information:         -3
//
//   Score 0–2 = LOW · 3–4 = MEDIUM · 5+ = HIGH · no evidence = UNVERIFIED
//
// The breakdown is shown to users (methodology is part of the product).

import type { ConfidenceAssessment, ConfidenceLevel } from "@/lib/types";

export interface ConfidenceInput {
  /** The exact username was found on ≥1 public profile page. */
  exactUsernameMatch: boolean;
  /** A public profile links to a website that another trace also connects to. */
  sameLinkedWebsite: boolean;
  /** Two independent public pages reference the same profile or site. */
  samePublicProfileReference: boolean;
  /** Traces span ≥3 years without contradictory gaps. */
  consistentTimeline: boolean;
  /** Two platform profiles carry conflicting public information. */
  conflictingInformation: boolean;
}

function levelFor(score: number, anyEvidence: boolean): ConfidenceLevel {
  if (!anyEvidence) return "UNVERIFIED";
  if (score >= 5) return "HIGH";
  if (score >= 3) return "MEDIUM";
  return "LOW";
}

/** Apply the published heuristic. Pure — identical input, identical output. */
export function assessConfidence(input: ConfidenceInput): ConfidenceAssessment {
  const breakdown: { signal: string; weight: number }[] = [];
  let score = 0;

  if (input.exactUsernameMatch) {
    score += 2;
    breakdown.push({ signal: "Exact username match on a public profile", weight: 2 });
  }
  if (input.sameLinkedWebsite) {
    score += 3;
    breakdown.push({ signal: "Same website linked from public evidence", weight: 3 });
  }
  if (input.samePublicProfileReference) {
    score += 2;
    breakdown.push({ signal: "Same public profile referenced independently", weight: 2 });
  }
  if (input.consistentTimeline) {
    score += 1;
    breakdown.push({ signal: "Consistent timeline across years", weight: 1 });
  }
  if (input.conflictingInformation) {
    score -= 3;
    breakdown.push({ signal: "Conflicting information between sources", weight: -3 });
  }

  const anyEvidence =
    input.exactUsernameMatch ||
    input.sameLinkedWebsite ||
    input.samePublicProfileReference ||
    input.consistentTimeline;

  return { score, level: levelFor(score, anyEvidence), breakdown };
}

/** Trace-level confidence for a directly observed public artifact. */
export function directObservation(): ConfidenceLevel {
  return "HIGH";
}

/** Trace-level confidence for a link read off a public page. */
export function linkedEvidence(): ConfidenceLevel {
  return "MEDIUM";
}

/** Trace-level confidence for a label match with no verified link. */
export function labelMatchOnly(): ConfidenceLevel {
  return "LOW";
}
