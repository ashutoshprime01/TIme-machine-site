// ArchiveService (plan §29): the only entry point the rest of the app uses
// to reach archived data. Providers can be swapped via ARCHIVE_PROVIDER
// without touching any UI code, and a dead provider degrades gracefully.

import type { ArchiveProvider } from "./types";
import { ArchiveError } from "./types";
import { WaybackProvider } from "./wayback";
import type { Capture } from "@/lib/types";
import { captureYear } from "@/lib/security/url";

const registry: Record<string, () => ArchiveProvider> = {
  wayback: () => new WaybackProvider(),
  // Future: SecondArchiveProvider, LocalDatasetProvider (plan §29)
};

function activeProvider(): ArchiveProvider {
  const key = process.env.ARCHIVE_PROVIDER ?? "wayback";
  const factory = registry[key] ?? registry.wayback;
  return factory();
}

export interface CaptureSummary {
  total: number;
  firstYear: string;
  lastYear: string;
  years: string[];
  capturesByYear: Record<string, Capture[]>;
  /** False when some archive windows failed — the timeline may be incomplete. */
  complete: boolean;
}

export const archive = {
  providerName(): string {
    return activeProvider().name;
  },

  async searchCaptures(domain: string): Promise<Capture[]> {
    return activeProvider().searchCaptures(domain);
  },

  async searchCapturesWithMeta(
    domain: string
  ): Promise<{ captures: Capture[]; complete: boolean }> {
    return activeProvider().searchCapturesWithMeta(domain);
  },

  async getCaptureSummary(domain: string): Promise<CaptureSummary> {
    const { captures, complete } = await this.searchCapturesWithMeta(domain);
    const capturesByYear: Record<string, Capture[]> = {};
    for (const c of captures) {
      const y = captureYear(c.timestamp);
      (capturesByYear[y] ??= []).push(c);
    }
    return {
      total: captures.length,
      firstYear: captures[0] ? captureYear(captures[0].timestamp) : "",
      lastYear: captures.length
        ? captureYear(captures[captures.length - 1].timestamp)
        : "",
      years: Object.keys(capturesByYear).sort(),
      capturesByYear,
      complete,
    };
  },

  /** Nearest capture at-or-before the wanted timestamp (or nearest overall). */
  nearestCapture(captures: Capture[], timestamp: string): Capture | null {
    if (captures.length === 0) return null;
    let best: Capture | null = null;
    let bestDist = Infinity;
    for (const c of captures) {
      const dist = Math.abs(Number(c.timestamp) - Number(timestamp));
      if (dist < bestDist) {
        bestDist = dist;
        best = c;
      }
    }
    return best;
  },

  async getContent(originalUrl: string, timestamp: string) {
    return activeProvider().getContent(originalUrl, timestamp);
  },

  replayUrl(originalUrl: string, timestamp: string): string {
    return activeProvider().replayUrl(originalUrl, timestamp);
  },
};

export { ArchiveError };
