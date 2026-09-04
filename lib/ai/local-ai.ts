// LocalAIProvider — optional local model integration. Activated only when
// AI_ENDPOINT is configured. Every method degrades to the NoAIProvider
// result when the endpoint is missing or unreachable, so the app never
// depends on it (master prompt: "The entire application must work with
// NoAIProvider").

import type { AIProvider, Observation } from "@/lib/ai/provider";
import { NoAIProvider } from "@/lib/ai/no-ai";
import type { IdentityReport, KnowledgeStatus } from "@/lib/types";
import { logger } from "@/lib/logger";

const TIMEOUT_MS = 15_000;

/** Minimal OpenAI-compatible chat-completions contract (local runtimes). */
interface ChatRequest {
  messages: { role: "system" | "user"; content: string }[];
  max_tokens?: number;
  temperature?: number;
}

export class LocalAIProvider implements AIProvider {
  readonly name = "local-ai";
  private fallback = new NoAIProvider();

  constructor(
    private readonly endpoint: string,
    private readonly model: string
  ) {}

  private async complete(system: string, user: string, maxTokens = 200): Promise<string | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const body: ChatRequest = {
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
      };
      const res = await fetch(this.endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, model: this.model }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return data.choices?.[0]?.message?.content?.trim() ?? null;
    } catch (err) {
      logger.warn("ai: local endpoint unreachable, using deterministic fallback", { err: String(err) });
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async summarize(report: IdentityReport): Promise<string> {
    const evidence = report.traces
      .slice(0, 10)
      .map((t) => `- ${t.type}: ${t.title} (${captureYearSafe(t.observedAt)}, ${t.confidence})`)
      .join("\n");
    const out = await this.complete(
      "You summarize public web-archaeology evidence. Never claim two accounts belong to the same person. Never invent facts. Reply in 2-3 sentences.",
      `Evidence for "${report.query}":\n${evidence}\nSummarize what was directly observed.`
    );
    return out ?? this.fallback.summarize(report);
  }

  async explain(report: IdentityReport, traceIndex: number): Promise<string> {
    const trace = report.traces[traceIndex];
    if (!trace) return this.fallback.explain(report, traceIndex);
    const out = await this.complete(
      "You explain public web-archaeology evidence in plain language. Never invent facts. 2-3 sentences.",
      `Evidence: ${trace.evidence.label} — ${trace.evidence.reason} Source: ${trace.source}.`
    );
    return out ?? this.fallback.explain(report, traceIndex);
  }

  async classify(statement: string): Promise<KnowledgeStatus> {
    const out = await this.complete(
      'Classify the statement as exactly one word: FACT, INFERENCE, or HYPOTHESIS. FACT = directly observed. INFERENCE = reasonable interpretation. HYPOTHESIS = speculation.',
      statement,
      5
    );
    const normalized = out?.toUpperCase().trim();
    if (normalized === "FACT" || normalized === "INFERENCE" || normalized === "HYPOTHESIS") {
      return normalized;
    }
    return this.fallback.classify(statement);
  }

  async generateHypothesis(report: IdentityReport): Promise<Observation> {
    const base = await this.fallback.generateHypothesis(report);
    const out = await this.complete(
      "You generate clearly-labeled speculation from public web-archaeology evidence. Always hedge; never state identity matches as facts. 2 sentences.",
      `Traces for "${report.query}": ${report.traces.map((t) => `${t.type} ${captureYearSafe(t.observedAt)}`).join(", ")}. Propose one hypothesis about this public presence's history.`
    );
    return out ? { status: "HYPOTHESIS", text: out } : base;
  }
}

function captureYearSafe(ts: string): string {
  return /^\d{4}/.test(ts) ? ts.slice(0, 4) : "unknown year";
}
