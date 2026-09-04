// URL / domain normalization and SSRF protection (plan §8, §33).
// Archive lookups only ever target the provider (web.archive.org) by hostname,
// but these guards keep any future direct-fetch provider honest too.

export interface DomainValidation {
  ok: boolean;
  domain?: string;
  error?: string;
}

/**
 * Normalize user input (URL, domain, or site name) to a bare domain.
 *
 *   "https://www.example.com/page?q=1" -> "example.com"
 *   "WWW.Example.com/"                 -> "example.com"
 */
export function normalizeInput(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, ""); // strip scheme
  s = s.split(/[/?#]/)[0]; // keep host only
  s = s.replace(/^www\./, "");
  s = s.replace(/\.+$/, "");
  // strip userinfo if pasted as url
  if (s.includes("@")) s = s.split("@").pop() ?? s;
  return s;
}

const HOSTNAME_RE =
  /^(?!-)[a-z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-z0-9-]{1,63}(?<!-))*\.[a-z]{2,24}$/;

/** True for loopback, private, link-local, reserved or literal-IP hosts. */
export function isPrivateOrReservedHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h.endsWith(".home.arpa")
  ) {
    return true;
  }

  // IPv6 literals — block all (covers ::1, fc00::/7, fe80::/10, etc.)
  if (h.includes(":")) return true;

  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if ([a, b, Number(v4[3]), Number(v4[4])].some((n) => n > 255)) return true;
    if (a === 0 || a === 10 || a === 127) return true; // this-network, private, loopback
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 169 && b === 254) return true; // link-local
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast + reserved
    return true; // a bare IP is never a public website entity — reject outright
  }

  return false;
}

/** Validate a user-supplied domain for archive lookup. */
export function validateDomain(raw: string): DomainValidation {
  const domain = normalizeInput(raw);
  if (!domain) return { ok: false, error: "Please enter a website to search." };
  if (domain.length > 253)
    return { ok: false, error: "That input is too long to be a website address." };
  if (!HOSTNAME_RE.test(domain))
    return {
      ok: false,
      error: `"${domain}" doesn't look like a website domain (e.g. google.com). Try searching for the site's address.`,
    };
  if (isPrivateOrReservedHost(domain))
    return { ok: false, error: "Internal and local addresses cannot be searched." };
  return { ok: true, domain };
}

/** Parse a CDX timestamp (YYYYMMDDhhmmss, UTC) into a display date. */
export function parseCdxTimestamp(ts: string): Date {
  const [y, mo, d, h = "0", mi = "0", s = "0"] = [
    ts.slice(0, 4),
    ts.slice(4, 6),
    ts.slice(6, 8),
    ts.slice(8, 10),
    ts.slice(10, 12),
    ts.slice(12, 14),
  ];
  return new Date(
    Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s))
  );
}

export function formatCaptureDate(ts: string): string {
  return parseCdxTimestamp(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function captureYear(ts: string): string {
  return ts.slice(0, 4);
}

export function isCdxTimestamp(ts: string): boolean {
  return /^\d{14}$/.test(ts) || /^\d{8}$/.test(ts);
}
