// Simple in-memory sliding-window rate limiter (plan §32, §84).
// Good enough for a single-instance MVP; swap for Redis in production.

const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart);

  if (hits.length >= limit) {
    const retryAfterMs = hits[0] + windowMs - now;
    buckets.set(key, hits);
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, remaining: limit - hits.length, retryAfterSeconds: 0 };
}

/** Periodically drop stale buckets so the map doesn't grow forever. */
if (typeof setInterval === "function") {
  const timer = setInterval(() => {
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [key, hits] of buckets) {
      const alive = hits.filter((t) => t > cutoff);
      if (alive.length === 0) buckets.delete(key);
      else buckets.set(key, alive);
    }
  }, 5 * 60 * 1000);
  (timer as unknown as { unref?: () => void }).unref?.();
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "local"
  );
}
