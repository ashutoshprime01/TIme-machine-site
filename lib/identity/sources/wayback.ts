// Wayback CDX source for Identity History: checks whether public profile
// URL shapes (github.com/<u>, twitter.com/<u>, …) or a domain have archived
// captures. Reuses the WaybackProvider's shared politeness limiter and retry
// logic (lib/archive/wayback.ts) so the whole app stays within one rate budget
// against web.archive.org.

import { CDX_ENDPOINT, REPLAY_BASE, throttled, fetchWithRetry } from "@/lib/archive/wayback";
import { PUBLIC_PROFILE_PLATFORMS } from "@/lib/identity/privacy";
import { cacheGet, cacheSet, TTL } from "@/lib/cache";
import { logger } from "@/lib/logger";

const CDX_TIMEOUT_MS = 30_000;
/**
 * Identity probes are best-effort: one retry (3s backoff) instead of the
 * archive client's two, so a rate-limited upstream doesn't turn a
 * speculative probe into a nine-second stall. A failed probe is an honest
 * miss, and the engine caches the result either way.
 */
const PROBE_MAX_RETRIES = 1;

export interface PlatformHit {
  platformId: string;
  platformName: string;
  /** Public profile URL shape, e.g. "github.com/torvalds". */
  profileUrl: string;
  /** Live profile URL. */
  liveUrl: string;
  firstTimestamp: string;
  lastTimestamp: string;
  captureCount: number;
}

export interface DomainHit {
  domain: string;
  firstTimestamp: string;
  lastTimestamp: string;
  captureCount: number;
}

/** First/last archived capture of a URL shape. null = never captured. */
async function cdxFirstLast(url: string): Promise<Omit<PlatformHit, "platformId" | "platformName" | "profileUrl" | "liveUrl"> | null> {
  const cacheKey = `identity:cdx:${url}`;
  // cacheGet can't distinguish a stored null from a miss, so misses are
  // stored as a sentinel object — otherwise empty probes would re-run the
  // full (slow) discovery on every visit.
  const cached = await cacheGet<{ firstTimestamp: string; lastTimestamp: string; captureCount: number } | { miss: true }>(cacheKey);
  if (cached) {
    return "miss" in cached ? null : cached;
  }

  const params = new URLSearchParams({
    url,
    output: "json",
    fl: "timestamp",
    filter: "statuscode:200",
    collapse: "timestamp:4", // one capture per year
    limit: "100",
  });
  const res = await throttled(() =>
    fetchWithRetry(`${CDX_ENDPOINT}?${params}`, CDX_TIMEOUT_MS, PROBE_MAX_RETRIES)
  );
  if (res.status === 404) {
    await cacheSet(cacheKey, { miss: true }, TTL.capturesPartial);
    return null;
  }
  if (!res.ok) {
    // Treat upstream trouble as "no data" — identity search must not fail
    // wholesale because one probe couldn't run. Not cached: retry next time.
    logger.warn("identity: cdx probe failed", { url, status: res.status });
    return null;
  }
  const body = await res.text();
  if (!body.trim()) {
    await cacheSet(cacheKey, { miss: true }, TTL.capturesPartial);
    return null;
  }
  try {
    const rows = JSON.parse(body) as string[][];
    const dataRows = rows[0]?.[0] === "timestamp" ? rows.slice(1) : rows;
    const ts = dataRows
      .map((r) => r[0])
      .filter((t) => /^\d{14}$/.test(t))
      .sort();
    if (ts.length === 0) {
      await cacheSet(cacheKey, { miss: true }, TTL.capturesPartial);
      return null;
    }
    const hit = { firstTimestamp: ts[0], lastTimestamp: ts[ts.length - 1], captureCount: ts.length };
    await cacheSet(cacheKey, hit, TTL.captures);
    return hit;
  } catch {
    logger.warn("identity: cdx probe unparseable", { url });
    return null;
  }
}

/**
 * Probe every allowlisted public profile platform for a username.
 * Returns only the platforms with archived captures — an empty array is an
 * honest "nothing found", never an error.
 */
export async function probeProfilePlatforms(username: string): Promise<PlatformHit[]> {
  const results = await Promise.all(
    PUBLIC_PROFILE_PLATFORMS.map(async (p) => {
      const hit = await cdxFirstLast(p.url(username)).catch(() => null);
      if (!hit) return null;
      return {
        platformId: p.id,
        platformName: p.name,
        profileUrl: p.url(username),
        liveUrl: p.live(username),
        ...hit,
      } satisfies PlatformHit;
    })
  );
  return results.filter((r): r is PlatformHit => r !== null);
}

/** Probe one domain for archived captures. null = none. */
export async function probeDomain(domain: string): Promise<DomainHit | null> {
  const hit = await cdxFirstLast(domain).catch(() => null);
  return hit ? { domain, ...hit } : null;
}

/** Wayback replay URL for evidence inspection. */
export function replayUrl(url: string, timestamp: string): string {
  return `${REPLAY_BASE}/${timestamp}if_/${url}`;
}
