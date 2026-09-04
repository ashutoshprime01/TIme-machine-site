// Privacy enforcement for Identity History (master prompt, PRIVACY AND SAFETY).
//
// This module is the single choke point for what may never enter the system:
//   - no private accounts, no login bypass, no scraping behind auth
//   - no addresses, phone numbers, private emails, passwords, financial info
//   - no facial recognition, no identity-from-image-similarity
//
// scrubSensitive() runs on every piece of text fetched from a public source
// before it is stored in the database or shown to a user.

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
// Phone-like: 7+ digits with optional separators, optional leading +.
const PHONE_RE = /\+?\d[\d\s().-]{6,}\d/g;
const SECRET_RE = /\b(password|passwd|passcode|secret|token|api[_-]?key|private[_-]?key|credit[_-]?card|ssn)\b\s*[:=]\s*\S+/gi;

/** Remove emails, phone-like numbers and credential-shaped strings. */
export function scrubSensitive(text: string): string {
  return text
    .replace(EMAIL_RE, "[redacted email]")
    .replace(PHONE_RE, (m) => (m.replace(/\D/g, "").length >= 7 ? "[redacted number]" : m))
    .replace(SECRET_RE, "$1: [redacted]")
    .trim();
}

/** True when text survived scrubbing unchanged (nothing sensitive found). */
export function isClean(text: string): boolean {
  return scrubSensitive(text) === text;
}

// Platform allowlist: only public profile URL shapes are ever queried. A
// platform not on this list is never probed, fetched, or stored — this is
// how "public-web archaeology only" is enforced in code.
export interface PublicProfilePlatform {
  id: string;
  name: string;
  /** Public profile URL shape, e.g. github.com/<username>. */
  url: (username: string) => string;
  /** Live URL of the profile, for display and inspection. */
  live: (username: string) => string;
}

export const PUBLIC_PROFILE_PLATFORMS: PublicProfilePlatform[] = [
  { id: "github", name: "GitHub", url: (u) => `github.com/${u}`, live: (u) => `https://github.com/${u}` },
  { id: "twitter", name: "Twitter", url: (u) => `twitter.com/${u}`, live: (u) => `https://twitter.com/${u}` },
  { id: "x", name: "X", url: (u) => `x.com/${u}`, live: (u) => `https://x.com/${u}` },
  { id: "reddit", name: "Reddit", url: (u) => `reddit.com/user/${u}`, live: (u) => `https://www.reddit.com/user/${u}` },
  { id: "instagram", name: "Instagram", url: (u) => `instagram.com/${u}`, live: (u) => `https://www.instagram.com/${u}` },
  { id: "youtube", name: "YouTube", url: (u) => `youtube.com/@${u}`, live: (u) => `https://www.youtube.com/@${u}` },
];
