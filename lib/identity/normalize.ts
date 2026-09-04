// Identity query classification (master prompt: a user may enter a name,
// username, handle, public alias, or domain). This module only normalizes and
// generates *candidate* usernames — it never asserts any of them belong to
// the same person.

import { validateDomain } from "@/lib/security/url";

export type IdentityQueryKind = "username" | "name" | "domain";

export interface IdentityQuery {
  kind: IdentityQueryKind;
  /** Normalized, URL-safe key: "johnsmith" or "johnsmith.dev". */
  key: string;
  /** What the user typed, preserved for display. */
  raw: string;
  /** Display name for the report header. */
  displayName: string;
  /** Username candidates to probe on public platforms (deduped, max 3). */
  usernameCandidates: string[];
  /** The domain itself when kind === "domain". */
  domain?: string;
  /** Validation error, if any. */
  error?: string;
}

/** Safe username charset: what public platforms actually allow. */
const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{0,38}$/;

function safeUsername(s: string): string | null {
  return USERNAME_RE.test(s) ? s : null;
}

/**
 * Classify an identity search input.
 *
 *   "@johnsmith"    → username
 *   "johnsmith"     → username
 *   "John Smith"    → name (candidates: johnsmith, john-smith, john_smith)
 *   "johnsmith.dev" → domain (+ username candidate "johnsmith")
 */
export function classifyIdentityQuery(rawInput: string): IdentityQuery {
  const raw = rawInput.trim();
  if (!raw) {
    return { kind: "username", key: "", raw, displayName: "", usernameCandidates: [], error: "Please enter something to search." };
  }
  if (raw.length > 64) {
    return { kind: "username", key: "", raw, displayName: "", usernameCandidates: [], error: "That input is too long to search." };
  }

  // Explicit handle syntax forces username mode.
  if (raw.startsWith("@")) {
    const u = safeUsername(raw.slice(1).toLowerCase());
    if (!u) {
      return { kind: "username", key: "", raw, displayName: raw, usernameCandidates: [], error: `"${raw}" doesn't look like a public handle.` };
    }
    return { kind: "username", key: u, raw, displayName: `@${u}`, usernameCandidates: [u] };
  }

  // Spaced input is a person/company name.
  if (/\s/.test(raw)) {
    const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (!key || key.length < 2) {
      return { kind: "username", key: "", raw, displayName: raw, usernameCandidates: [], error: "Please enter a name, username, or domain." };
    }
    const hyphen = raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const under = hyphen.replace(/-/g, "_");
    const candidates = [...new Set([key, hyphen, under].filter((c): c is string => !!c && !!safeUsername(c)))].slice(0, 3);
    if (candidates.length === 0) {
      return { kind: "username", key: "", raw, displayName: raw, usernameCandidates: [], error: "That name doesn't produce a searchable username." };
    }
    return { kind: "name", key, raw, displayName: raw, usernameCandidates: candidates };
  }

  // Dotted input: try domain first.
  if (raw.includes(".")) {
    const domainCheck = validateDomain(raw);
    if (domainCheck.ok && domainCheck.domain) {
      const domain = domainCheck.domain;
      const label = domain.split(".")[0];
      const candidates = safeUsername(label) ? [label] : [];
      return {
        kind: "domain",
        key: domain,
        raw,
        displayName: domain,
        usernameCandidates: candidates,
        domain,
      };
    }
    return { kind: "username", key: "", raw, displayName: raw, usernameCandidates: [], error: `"${raw}" is neither a valid domain nor a username.` };
  }

  // Bare token: username.
  const u = safeUsername(raw.toLowerCase());
  if (!u) {
    return { kind: "username", key: "", raw, displayName: raw, usernameCandidates: [], error: `"${raw}" doesn't look like a public handle (letters, digits, ".", "-", "_" only).` };
  }
  return { kind: "username", key: u, raw, displayName: u, usernameCandidates: [u] };
}

/** ISO date → CDX-style 14-digit timestamp (YYYYMMDDhhmmss, UTC). */
export function isoToCdx(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "00000000000000";
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return (
    `${p(d.getUTCFullYear(), 4)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`
  );
}
