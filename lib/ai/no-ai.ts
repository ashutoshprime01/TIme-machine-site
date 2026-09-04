// NoAIProvider — the default. Deterministic templates over real evidence:
// no model, no cost, no network. Every narrative it produces is composed
// from facts already present in the IdentityReport, which keeps the
// FACT / INFERENCE / HYPOTHESIS labels honest by construction.

import type { AIProvider, Observation } from "@/lib/ai/provider";
import type { IdentityReport, KnowledgeStatus } from "@/lib/types";
import { captureYear } from "@/lib/security/url";

const HYPOTHESIS_HINTS = [
  "might",
  "may",
  "could",
  "possibly",
  "likely",
  "perhaps",
  "probably",
];

export class NoAIProvider implements AIProvider {
  readonly name = "no-ai";

  async summarize(report: IdentityReport): Promise<string> {
    const profiles = report.traces.filter((t) => t.type === "PROFILE").length;
    const websites = report.traces.filter((t) => t.type === "WEBSITE").length;
    const domains = report.traces.filter((t) => t.type === "DOMAIN").length;
    const parts: string[] = [];

    if (report.traces.length === 0) {
      return `No publicly discoverable traces were found for ${report.displayName} in the sources this system searches.`;
    }

    const bits: string[] = [];
    if (profiles) bits.push(`${profiles} public profile page${profiles === 1 ? "" : "s"}`);
    if (websites) bits.push(`${websites} linked website${websites === 1 ? "" : "s"}`);
    if (domains) bits.push(`${domains} domain${domains === 1 ? "" : "s"}`);
    parts.push(`This system found ${bits.join(", ")} associated with the search "${report.query}".`);

    if (report.firstObservedAt && report.lastObservedAt) {
      const first = captureYear(report.firstObservedAt);
      const last = captureYear(report.lastObservedAt);
      parts.push(
        first === last
          ? `All observed traces fall within ${first}.`
          : `The observed traces span ${first} to ${last}.`
      );
    }

    parts.push(
      `Overall evidence confidence is ${report.confidence.level.toLowerCase()} — these are publicly discoverable traces found by this system, not a verified identity.`
    );
    return parts.join(" ");
  }

  async explain(report: IdentityReport, traceIndex: number): Promise<string> {
    const trace = report.traces[traceIndex];
    if (!trace) return "No evidence exists at this position.";
    return `${trace.evidence.label}: ${trace.evidence.reason} Observed via ${trace.source}. Confidence for this trace: ${trace.confidence}.`;
  }

  async classify(statement: string): Promise<KnowledgeStatus> {
    const lower = statement.toLowerCase();
    if (HYPOTHESIS_HINTS.some((h) => lower.includes(` ${h} `)) || lower.includes("will ")) {
      return "HYPOTHESIS";
    }
    if (lower.includes("appears") || lower.includes("suggests") || lower.includes("consistent with")) {
      return "INFERENCE";
    }
    return "FACT";
  }

  async generateHypothesis(report: IdentityReport): Promise<Observation> {
    if (report.traces.length < 2) {
      return {
        status: "HYPOTHESIS",
        text: "With fewer than two traces, any pattern would be speculation — this system declines to invent one.",
      };
    }

    const years = report.traces
      .map((t) => Number(captureYear(t.observedAt)))
      .filter((y) => y > 0)
      .sort((a, b) => a - b);
    const gap = years.length > 1 ? years[years.length - 1] - years[0] : 0;

    if (gap >= 5) {
      return {
        status: "HYPOTHESIS",
        text: `Public traces under this name appear continuously from ${years[0]} to ${years[years.length - 1]}. If the same public presence is behind them, it has been active for ${gap} years — but name or username reuse by different people cannot be ruled out from this evidence alone.`,
      };
    }

    const platforms = new Set(
      report.traces.filter((t) => t.type === "PROFILE").map((t) => t.source)
    );
    if (platforms.size >= 2) {
      return {
        status: "HYPOTHESIS",
        text: `The same username appears on ${platforms.size} platforms' public pages. This is consistent with one public presence using a consistent handle — and equally consistent with different people choosing the same username.`,
      };
    }

    return {
      status: "HYPOTHESIS",
      text: "The available evidence is too sparse to support a meaningful pattern. More public sources would be needed before even speculating.",
    };
  }
}
