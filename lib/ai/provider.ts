// AI provider abstraction (master prompt, AI ARCHITECTURE).
//
//   interface AIProvider { summarize(); explain(); classify(); generateHypothesis(); }
//
// AI is a plugin, not a requirement: the entire application runs on
// NoAIProvider. LocalAIProvider activates only when AI_ENDPOINT is configured
// and degrades gracefully when the endpoint is unreachable.

import type { IdentityReport, KnowledgeStatus } from "@/lib/types";

/** A generated observation — always labeled with its epistemic status. */
export interface Observation {
  status: KnowledgeStatus;
  text: string;
}

export interface AIProvider {
  readonly name: string;
  /** Short, evidence-grounded summary of a report. */
  summarize(report: IdentityReport): Promise<string>;
  /** Plain-language explanation of a single piece of evidence. */
  explain(report: IdentityReport, traceIndex: number): Promise<string>;
  /** Classify a statement as FACT / INFERENCE / HYPOTHESIS. */
  classify(statement: string): Promise<KnowledgeStatus>;
  /** Clearly-labeled speculation derived from real evidence. */
  generateHypothesis(report: IdentityReport): Promise<Observation>;
}
