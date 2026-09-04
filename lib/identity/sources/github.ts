// GitHub public API source for Identity History.
//
// Unauthenticated, public, documented API (api.github.com) — 60 requests/hour
// per IP, no keys, no cost. Only the *public profile object* is read; this
// module never touches followers, emails, private data, or authenticated
// endpoints. All free-text fields pass through scrubSensitive().

import { scrubSensitive } from "@/lib/identity/privacy";
import { cacheGet, cacheSet } from "@/lib/cache";
import { logger } from "@/lib/logger";

const GITHUB_API = "https://api.github.com/users";
const TIMEOUT_MS = 10_000;
/** 24h — profile fields change rarely, and this keeps us far under the quota. */
const TTL_MS = 1000 * 60 * 60 * 24;

export interface GitHubPublicProfile {
  login: string;
  name: string | null;
  bio: string | null;
  /** Public "Website/Blog" profile field, normalized to a bare domain or null. */
  blogDomain: string | null;
  htmlUrl: string;
  /** ISO 8601 account creation date (public profile field). */
  createdAt: string;
  publicRepos: number;
}

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

/**
 * Fetch the public GitHub profile for a login. Returns null for 404 (no such
 * user), rate-limit responses, and any upstream trouble — a missing source is
 * an honest "nothing from GitHub", never a failed search.
 */
export async function fetchGitHubPublicProfile(username: string): Promise<GitHubPublicProfile | null> {
  const cacheKey = `identity:github:${username.toLowerCase()}`;
  // Misses are cached as a sentinel so absent profiles don't re-probe the
  // API on every visit (the quota is only 60 requests/hour).
  const cached = await cacheGet<GitHubPublicProfile | { miss: true }>(cacheKey);
  if (cached) {
    return "miss" in cached ? null : cached;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${GITHUB_API}/${encodeURIComponent(username)}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "InternetTimeMachine/2.0 (public web archaeology; educational)",
      },
    });
    if (res.status === 404) {
      await cacheSet(cacheKey, { miss: true }, TTL_MS);
      return null;
    }
    if (!res.ok) {
      logger.warn("identity: github api unavailable", { username, status: res.status });
      return null;
    }
    const data = (await res.json()) as {
      login?: string;
      name?: string | null;
      bio?: string | null;
      blog?: string | null;
      html_url?: string;
      created_at?: string;
      public_repos?: number;
    };
    if (!data.login || !data.html_url || !data.created_at) return null;

    const profile: GitHubPublicProfile = {
      login: data.login,
      // Public free-text passes the privacy scrub before storage/display.
      name: data.name ? scrubSensitive(data.name) : null,
      bio: data.bio ? scrubSensitive(data.bio) : null,
      blogDomain: data.blog?.trim() ? extractDomain(data.blog.trim()) : null,
      htmlUrl: data.html_url,
      createdAt: data.created_at,
      publicRepos: data.public_repos ?? 0,
    };
    await cacheSet(cacheKey, profile, TTL_MS);
    return profile;
  } catch (err) {
    logger.warn("identity: github api error", { username, err: String(err) });
    return null;
  } finally {
    clearTimeout(timer);
  }
}
