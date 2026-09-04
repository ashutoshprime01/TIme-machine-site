// AI factory (master prompt: "AI is a plugin, not a requirement").
//
// Default: NoAIProvider — deterministic, offline, zero-cost.
// Set AI_ENDPOINT (OpenAI-compatible chat-completions URL) and optionally
// AI_MODEL to activate LocalAIProvider, which still degrades to NoAIProvider
// whenever the endpoint is unavailable.

import type { AIProvider } from "@/lib/ai/provider";
import { NoAIProvider } from "@/lib/ai/no-ai";
import { LocalAIProvider } from "@/lib/ai/local-ai";

let cached: AIProvider | null = null;

export function getAI(): AIProvider {
  if (cached) return cached;
  const endpoint = process.env.AI_ENDPOINT?.trim();
  if (endpoint) {
    cached = new LocalAIProvider(endpoint, process.env.AI_MODEL?.trim() || "local-model");
  } else {
    cached = new NoAIProvider();
  }
  return cached;
}

export type { AIProvider, Observation } from "@/lib/ai/provider";
