// Wayback Machine (Internet Archive) provider — free, public CDX API.
// Be a respectful citizen (plan §32): bounded concurrency, request spacing,
// caching, retries with exponential backoff, strict timeouts.
//
// The CDX endpoint can be slow and full-range queries for heavily-crawled
// domains sometimes fail server-side, so capture searches are issued as
// date-windowed chunks (which reliably succeed) and merged.

import { createHash } from "crypto";
import type { ArchiveContent, ArchiveProvider } from "./types";
import { ArchiveError } from "./types";
import type { Capture } from "@/lib/types";
import { cacheGet, cacheSet, TTL } from "@/lib/cache";
import { logger } from "@/lib/logger";

const CDX_ENDPOINT = "https://web.archive.org/cdx/search/cdx";
const REPLAY_BASE = "https://web.archive.org/web";

export { CDX_ENDPOINT, REPLAY_BASE };

/** Politeness limits: at most 3 concurrent requests, spaced ≥ 500 ms. */
const MAX_CONCURRENT = 3;
const MIN_START_GAP_MS = 500;
/** CDX can legitimately take tens of seconds when the archive is struggling. */
const CDX_TIMEOUT_MS = 60_000;
const CONTENT_TIMEOUT_MS = 45_000;
const MAX_RETRIES = 2;
/** Windows wider than this risk server-side timeouts on huge domains. */
const WINDOW_YEARS = 5;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---- global limiter: bounded concurrency + spaced starts ----
let activeCount = 0;
let lastStartAt = 0;
const waiters: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeCount >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiters.push(resolve));
    return acquireSlot();
  }
  const wait = lastStartAt + MIN_START_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastStartAt = Date.now();
  activeCount += 1;
}

function releaseSlot(): void {
  activeCount -= 1;
  waiters.shift()?.();
}

export async function throttled<T>(fn: () => Promise<T>): Promise<T> {
  await acquireSlot();
  try {
    return await fn();
  } finally {
    releaseSlot();
  }
}

export async function fetchWithRetry(
  url: string,
  timeoutMs: number,
  maxRetries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await sleep(1500 * Math.pow(2, attempt)); // 3s, 6s backoff
      logger.warn("wayback: retrying request", { url, attempt });
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "InternetTimeMachine/0.1 (educational archive explorer)" },
      });
      if (res.status >= 500 || res.status === 429) {
        lastError = new Error(`upstream ${res.status}`);
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new ArchiveError(
    `archive request failed after retries: ${url}`,
    "The archive provider is temporarily unavailable. Please try again in a moment.",
    lastError
  );
}

function friendlyCdxError(status: number): string {
  if (status === 403 || status === 429)
    return "The archive is limiting requests from us right now. Please wait a moment and try again.";
  return "We couldn't reach the archive provider. Please try again shortly.";
}

export class WaybackProvider implements ArchiveProvider {
  readonly name = "wayback";

  /** Single windowed CDX query. Empty result is not an error. */
  private async queryWindow(
    domain: string,
    from: string,
    to: string
  ): Promise<Capture[]> {
    const params = new URLSearchParams({
      url: domain,
      from,
      to,
      output: "json",
      fl: "timestamp,original,digest,statuscode",
      filter: "statuscode:200",
      collapse: "timestamp:6", // one capture per month per window
      limit: "500",
    });
    const res = await throttled(() =>
      fetchWithRetry(`${CDX_ENDPOINT}?${params}`, CDX_TIMEOUT_MS)
    );
    if (res.status === 404) return [];
    if (!res.ok) throw new ArchiveError(`cdx query failed: ${res.status}`, friendlyCdxError(res.status));
    const body = await res.text();
    if (!body.trim()) return [];
    let rows: string[][];
    try {
      rows = JSON.parse(body);
    } catch {
      throw new ArchiveError(
        "cdx returned unparseable payload",
        "We couldn't read the archive's response. Please try again."
      );
    }
    const dataRows = rows[0]?.[0] === "timestamp" ? rows.slice(1) : rows;
    return dataRows
      .map((r) => ({
        timestamp: r[0],
        original: r[1],
        digest: r[2],
        statusCode: Number(r[3]),
      }))
      .filter((c) => /^\d{14}$/.test(c.timestamp));
  }

  async searchCaptures(domain: string): Promise<Capture[]> {
    return (await this.searchCapturesWithMeta(domain)).captures;
  }

  /** Capture search plus completeness info (partial ≠ error). */
  async searchCapturesWithMeta(domain: string): Promise<{ captures: Capture[]; complete: boolean }> {
    const cacheKey = `wayback:captures:${domain}`;
    const cached = await cacheGet<{ captures: Capture[]; complete: boolean }>(cacheKey);
    if (cached) return cached;

    // Cheap probe for the first capture year, so we don't query empty decades.
    const firstYear = await this.firstCaptureYear(domain);

    const currentYear = new Date().getUTCFullYear();
    const windows: Array<[string, string]> = [];
    for (let start = firstYear; start <= currentYear; start += WINDOW_YEARS) {
      const end = Math.min(start + WINDOW_YEARS, currentYear);
      windows.push([String(start), String(end)]);
    }

    logger.info("wayback: searching captures", { domain, windows: windows.length });

    const results = await Promise.all(
      windows.map(([from, to]) =>
        this.queryWindow(domain, from, to).catch((err) => {
          logger.warn("wayback: window failed", { domain, from, to, err: String(err) });
          return null;
        })
      )
    );

    const ok = results.filter((r): r is Capture[] => r !== null);
    if (ok.length === 0) {
      throw new ArchiveError(
        `all cdx windows failed for ${domain}`,
        "We couldn't reach the archive provider. Please try again shortly."
      );
    }

    const captures = [...ok.flatMap((r) => r)]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      // dedupe across overlapping window edges
      .filter((c, i, arr) => i === 0 || c.timestamp !== arr[i - 1].timestamp);

    const complete = ok.length === windows.length;
    // Partial results go stale fast — the missing windows may work next try.
    await cacheSet(cacheKey, { captures, complete }, complete ? TTL.captures : TTL.capturesPartial);
    return { captures, complete };
  }

  /** Year of the earliest capture, or the current year for unknown domains. */
  private async firstCaptureYear(domain: string): Promise<number> {
    try {
      const params = new URLSearchParams({
        url: domain,
        limit: "1",
        fl: "timestamp",
        output: "json",
      });
      const res = await throttled(() =>
        fetchWithRetry(`${CDX_ENDPOINT}?${params}`, CDX_TIMEOUT_MS)
      );
      if (!res.ok) return 1995;
      const body = await res.text();
      if (!body.trim()) return new Date().getUTCFullYear();
      const rows = JSON.parse(body) as string[][];
      const first = rows[1]?.[0];
      if (first && /^\d{14}$/.test(first)) return Number(first.slice(0, 4));
    } catch {
      // probe is an optimization — fall through to a full scan
    }
    return 1995;
  }

  async getContent(originalUrl: string, timestamp: string): Promise<ArchiveContent> {
    const cacheKey = `wayback:html:${originalUrl}:${timestamp}`;
    const cached = await cacheGet<ArchiveContent>(cacheKey);
    if (cached) return cached;

    // `id_` returns the original archived bytes without Wayback rewriting.
    const url = `${REPLAY_BASE}/${timestamp}id_/${originalUrl}`;
    const res = await throttled(() => fetchWithRetry(url, CONTENT_TIMEOUT_MS));

    if (res.status === 404) {
      throw new ArchiveError(
        `no replay for ${originalUrl}@${timestamp}`,
        "This snapshot isn't available from the archive right now."
      );
    }
    if (!res.ok) {
      throw new ArchiveError(`replay failed: ${res.status}`, friendlyCdxError(res.status));
    }

    const html = await res.text();
    // Wayback redirects to the nearest capture; read it back from the final URL.
    const resolvedMatch = res.url.match(/\/web\/(\d{14})/);
    const content: ArchiveContent = {
      html,
      contentType: res.headers.get("content-type") ?? "text/html",
      contentHash: createHash("sha256").update(html).digest("hex"),
      resolvedTimestamp: resolvedMatch?.[1] ?? timestamp,
    };
    await cacheSet(cacheKey, content, TTL.html);
    return content;
  }

  replayUrl(originalUrl: string, timestamp: string): string {
    // `if_` = iframe mode: replayed page without the Wayback toolbar.
    return `${REPLAY_BASE}/${timestamp}if_/${originalUrl}`;
  }
}
