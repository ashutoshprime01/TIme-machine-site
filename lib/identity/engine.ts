// Identity discovery engine (master prompt, SEARCH PIPELINE):
//
//   Input → Normalize → Generate candidates → Collect permitted public
//   evidence → Deduplicate → Group possible matches → Score confidence →
//   Build timeline → Show evidence
//
// Hard rules encoded here:
//   - Only public, permit-free sources are queried (platform allowlist in
//     lib/identity/privacy.ts; GitHub public API).
//   - Traces are grouped under a *candidate identity*, never asserted to be
//     one person. Cross-platform username matches stay separate evidence.
//   - Nothing is fabricated: sources that return nothing are recorded in
//     sourcesQueried and the report may legitimately be empty.

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { cacheGet, cacheSet, TTL } from "@/lib/cache";
import { classifyIdentityQuery, isoToCdx, type IdentityQuery } from "@/lib/identity/normalize";
import { scrubSensitive } from "@/lib/identity/privacy";
import { assessConfidence, directObservation, linkedEvidence, type ConfidenceInput } from "@/lib/identity/confidence";
import { probeProfilePlatforms, probeDomain, replayUrl, type PlatformHit } from "@/lib/identity/sources/wayback";
import { fetchGitHubPublicProfile } from "@/lib/identity/sources/github";
import { formatCaptureDate } from "@/lib/security/url";
import type {
  ConfidenceAssessment,
  ConfidenceLevel,
  EvidenceBundle,
  IdentityReport,
  IdentityTraceItem,
} from "@/lib/types";

export class IdentityUnavailableError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string
  ) {
    super(message);
    this.name = "IdentityUnavailableError";
  }
}

// ── evidence helpers ─────────────────────────────────────────────────────────

function archivedPageEvidence(hit: PlatformHit): EvidenceBundle {
  return {
    label: "ARCHIVED PUBLIC PAGE",
    reason: `The Internet Archive holds ${hit.captureCount} capture${hit.captureCount === 1 ? "" : "s"} of ${hit.profileUrl} (earliest ${formatCaptureDate(hit.firstTimestamp)}). This is direct evidence a public page existed at this address — not that it belongs to any particular person.`,
    url: replayUrl(`https://${hit.profileUrl}`, hit.firstTimestamp),
    date: formatCaptureDate(hit.firstTimestamp),
    signals: ["exact-username-match"],
  };
}

// ── discovery ────────────────────────────────────────────────────────────────

async function discover(query: IdentityQuery): Promise<IdentityReport> {
  const traces: IdentityTraceItem[] = [];
  const aliases: IdentityReport["aliases"] = [];
  const relationships: IdentityReport["relationships"] = [];
  const sourcesQueried: string[] = [];

  // Collect evidence from every permitted source. A failing source is an
  // honest "nothing from here", never a failed search.
  const candidateResults = await Promise.all(
    query.usernameCandidates.map(async (u) => ({
      username: u,
      platforms: await probeProfilePlatforms(u).catch(() => []),
      github: await fetchGitHubPublicProfile(u).catch(() => null),
    }))
  );
  sourcesQueried.push(
    "Wayback Machine (archived public profile pages)",
    "GitHub public API"
  );

  const domainHit = query.domain ? await probeDomain(query.domain).catch(() => null) : null;
  if (query.domain) sourcesQueried.push(`Wayback Machine (${query.domain})`);

  for (const { username, platforms, github } of candidateResults) {
    const platformByld = new Map(platforms.map((p) => [p.platformId, p]));

    // Archived public profile pages (direct observations).
    for (const hit of platforms) {
      traces.push({
        id: `${username}:${hit.platformId}`,
        type: "PROFILE",
        title: `@${username} on ${hit.platformName}`,
        url: hit.liveUrl,
        source: `Wayback Machine (archive of ${hit.profileUrl})`,
        observedAt: hit.firstTimestamp,
        confidence: directObservation(),
        evidence: archivedPageEvidence(hit),
      });
    }

    // GitHub public profile (API). Skip the duplicate trace when an archived
    // GitHub page already carries the evidence — keep the API data for links.
    const ghTraceId = `${username}:github-api`;
    if (github && !platformByld.has("github")) {
      traces.push({
        id: ghTraceId,
        type: "PROFILE",
        title: `${github.login} — GitHub public profile`,
        url: github.htmlUrl,
        source: "GitHub public API",
        observedAt: isoToCdx(github.createdAt),
        confidence: directObservation(),
        evidence: {
          label: "PUBLIC PROFILE (GITHUB API)",
          reason: `Public GitHub profile, read via GitHub's documented public API. Account created ${github.createdAt.slice(0, 10)}${github.name ? `; public display name "${github.name}"` : ""}.`,
          url: github.htmlUrl,
          date: github.createdAt.slice(0, 10),
          signals: ["exact-username-match"],
        },
      });
    }

    // Website linked from the public GitHub profile. Links the profile to
    // the site — never claims ownership.
    if (github?.blogDomain) {
      const blogDomain = github.blogDomain;
      const blogHit = await probeDomain(blogDomain).catch(() => null);
      const observedAt = isoToCdx(github.createdAt);
      traces.push({
        id: `${username}:blog`,
        type: "WEBSITE",
        title: blogDomain,
        url: `https://${blogDomain}`,
        source: "GitHub public profile (website field)",
        observedAt: blogHit ? blogHit.firstTimestamp : observedAt,
        confidence: blogHit ? directObservation() : linkedEvidence(),
        evidence: {
          label: "LINKED WEBSITE",
          reason: `The public GitHub profile of @${github.login} lists this website in its public website field.${blogHit ? ` The Internet Archive independently holds ${blogHit.captureCount} capture(s) of it (earliest ${formatCaptureDate(blogHit.firstTimestamp)}).` : ""} This links the profile to the site — it does not verify ownership.`,
          url: blogHit ? replayUrl(`https://${blogDomain}`, blogHit.firstTimestamp) : github.htmlUrl,
          date: blogHit ? formatCaptureDate(blogHit.firstTimestamp) : github.createdAt.slice(0, 10),
          signals: ["same-linked-website"],
        },
        domain: blogDomain,
      });

      relationships.push({
        sourceTitle: `@${username} GitHub profile`,
        targetTitle: blogDomain,
        type: "links-to",
        confidence: linkedEvidence(),
        reason: "A public profile lists this website in its public website field.",
      });
    }

    // Public display name observed on the GitHub profile.
    if (github?.name) {
      aliases.push({
        alias: github.name,
        type: "name",
        firstSeen: isoToCdx(github.createdAt),
        lastSeen: null,
        source: "GitHub public profile (name field)",
        confidence: directObservation(),
      });
    }

    // Username alias: first/last public appearance across platform archives.
    const times = [
      ...platforms.flatMap((p) => [p.firstTimestamp, p.lastTimestamp]),
      ...(github ? [isoToCdx(github.createdAt)] : []),
    ].filter(Boolean).sort();
    if (times.length > 0) {
      aliases.push({
        alias: username,
        type: "username",
        firstSeen: times[0],
        lastSeen: times[times.length - 1],
        source: "Archived public profile pages",
        confidence: "LOW", // same username ≠ same person — always
      });
    }
  }

  // The queried domain itself (domain mode): archived captures are a fact.
  if (query.domain && domainHit) {
    const crossReferenced = candidateResults.some(
      ({ github }) => github?.blogDomain === query.domain
    );
    traces.push({
      id: `domain:${query.domain}`,
      type: "DOMAIN",
      title: query.domain,
      url: `https://${query.domain}`,
      source: "Wayback Machine",
      observedAt: domainHit.firstTimestamp,
      confidence: directObservation(),
      evidence: {
        label: "ARCHIVED DOMAIN",
        reason: `The Internet Archive holds ${domainHit.captureCount} capture${domainHit.captureCount === 1 ? "" : "s"} of this domain (earliest ${formatCaptureDate(domainHit.firstTimestamp)}, latest ${formatCaptureDate(domainHit.lastTimestamp)}).${crossReferenced ? " A public profile found in this search lists this domain as its website." : ""}`,
        url: replayUrl(`https://${query.domain}`, domainHit.firstTimestamp),
        date: formatCaptureDate(domainHit.firstTimestamp),
        signals: crossReferenced ? ["same-public-profile-reference"] : [],
      },
      domain: query.domain,
    });
  }

  // Deduplicate by (url, type) — keep the earliest observation.
  const seen = new Map<string, IdentityTraceItem>();
  for (const t of traces) {
    const k = `${t.url}|${t.type}`;
    const existing = seen.get(k);
    if (!existing || t.observedAt < existing.observedAt) seen.set(k, t);
  }
  const deduped = [...seen.values()].sort((a, b) => a.observedAt.localeCompare(b.observedAt));

  const allTimes = deduped.map((t) => t.observedAt).filter((t) => t !== "00000000000000");
  const firstObservedAt = allTimes[0] ?? null;
  const lastObservedAt = allTimes.length ? allTimes[allTimes.length - 1] : null;

  const report: IdentityReport = {
    key: query.key,
    displayName: query.displayName,
    kind: query.kind,
    query: query.raw,
    firstObservedAt,
    lastObservedAt,
    traces: deduped,
    aliases,
    relationships,
    confidence: assessConfidence(confidenceInput(deduped)),
    sourcesQueried,
  };
  return report;
}

// ── confidence derivation (runs identically for fresh and stored reports) ────

function confidenceInput(traces: IdentityTraceItem[]): ConfidenceInput {
  const years = traces
    .map((t) => Number(t.observedAt.slice(0, 4)))
    .filter((y) => y > 0);
  const span = years.length ? Math.max(...years) - Math.min(...years) : 0;
  return {
    exactUsernameMatch: traces.some((t) => t.evidence.signals.includes("exact-username-match")),
    sameLinkedWebsite: traces.some((t) => t.evidence.signals.includes("same-linked-website")),
    samePublicProfileReference: traces.some((t) =>
      t.evidence.signals.includes("same-public-profile-reference")
    ),
    consistentTimeline: span >= 3,
    conflictingInformation: traces.some((t) =>
      t.evidence.signals.includes("conflicting-information")
    ),
  };
}

// ── persistence ──────────────────────────────────────────────────────────────

async function persistReport(report: IdentityReport): Promise<void> {
  try {
    const identity = await prisma.identity.upsert({
      where: { key: report.key },
      create: {
        key: report.key,
        displayName: scrubSensitive(report.displayName),
        kind: report.kind,
        firstObservedAt: report.firstObservedAt,
        lastObservedAt: report.lastObservedAt,
      },
      update: {
        displayName: scrubSensitive(report.displayName),
        firstObservedAt: report.firstObservedAt,
        lastObservedAt: report.lastObservedAt,
      },
    });

    // Replace prior evidence (same sources → same result).
    const oldTraces = await prisma.identityTrace.findMany({
      where: { identityId: identity.id },
      select: { id: true },
    });
    const oldIds = oldTraces.map((t) => t.id);
    if (oldIds.length > 0) {
      await prisma.identityRelationship.deleteMany({
        where: { OR: [{ sourceTraceId: { in: oldIds } }, { targetTraceId: { in: oldIds } }] },
      });
    }
    await prisma.identityTrace.deleteMany({ where: { identityId: identity.id } });
    await prisma.identityAlias.deleteMany({ where: { identityId: identity.id } });

    for (const t of report.traces) {
      await prisma.identityTrace.create({
        data: {
          identityId: identity.id,
          type: t.type,
          title: scrubSensitive(t.title),
          url: t.url,
          source: t.source,
          observedAt: t.observedAt,
          confidence: t.confidence,
          evidence: JSON.stringify(t.evidence),
        },
      });
    }

    for (const a of report.aliases) {
      await prisma.identityAlias.create({
        data: {
          identityId: identity.id,
          alias: scrubSensitive(a.alias),
          type: a.type,
          firstSeen: a.firstSeen,
          lastSeen: a.lastSeen,
          source: a.source,
        },
      });
    }

    logger.info("identity: report stored", {
      key: report.key,
      traces: report.traces.length,
    });
  } catch (err) {
    // Persistence is an optimization — the report still renders.
    logger.warn("identity: persist failed", { key: report.key, err: String(err) });
  }
}

async function loadReport(key: string): Promise<IdentityReport | null> {
  const identity = await prisma.identity.findUnique({
    where: { key },
    include: { traces: true, aliases: true },
  });
  if (!identity) return null;

  const traces: IdentityTraceItem[] = identity.traces
    .map((t) => {
      let evidence: EvidenceBundle;
      try {
        evidence = JSON.parse(t.evidence) as EvidenceBundle;
      } catch {
        evidence = { label: "EVIDENCE", reason: "Evidence unavailable.", url: t.url, date: "", signals: [] };
      }
      const domain = t.url.startsWith("https://") && t.type !== "PROFILE"
        ? t.url.replace(/^https?:\/\//, "").split("/")[0]
        : undefined;
      return {
        id: t.id,
        type: t.type as IdentityTraceItem["type"],
        title: t.title,
        url: t.url,
        source: t.source,
        observedAt: t.observedAt,
        confidence: t.confidence as ConfidenceLevel,
        evidence,
        domain,
      } satisfies IdentityTraceItem;
    })
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));

  if (traces.length === 0) return null; // never persisted empty — re-discover

  const times = traces.map((t) => t.observedAt);
  return {
    key: identity.key,
    displayName: identity.displayName,
    kind: identity.kind as IdentityReport["kind"],
    query: identity.displayName,
    firstObservedAt: times[0] ?? null,
    lastObservedAt: times[times.length - 1] ?? null,
    traces,
    aliases: identity.aliases.map((a) => ({
      alias: a.alias,
      type: a.type as "username" | "name" | "domain",
      firstSeen: a.firstSeen,
      lastSeen: a.lastSeen,
      source: a.source,
      confidence: "LOW" as ConfidenceLevel,
    })),
    relationships: [],
    confidence: assessConfidence(confidenceInput(traces)),
    sourcesQueried: [],
  };
}

// ── public entry point ───────────────────────────────────────────────────────

/**
 * Resolve an identity search to a report: cached report when available
 * (including honest empty results — upstream 429/5xx retries make
 * re-discovery slow, so empties are cached too), then the stored DB
 * report, then fresh discovery. Throws IdentityUnavailableError for
 * invalid input.
 */
export async function getIdentityReport(input: string): Promise<IdentityReport> {
  const query = classifyIdentityQuery(input);
  if (query.error || !query.key) {
    throw new IdentityUnavailableError(`invalid identity query: ${input}`, query.error ?? "Please enter a name, username, or domain to search.");
  }

  const cacheKey = `identity:report:${query.key}`;
  const cached = await cacheGet<IdentityReport>(cacheKey);
  if (cached) return cached;

  const stored = await loadReport(query.key).catch(() => null);
  if (stored) return stored;

  const report = await discover(query);
  // Non-empty reports persist to the DB (permanent fast path); empty ones
  // only get the short-TTL cache so a later re-search can still find new
  // public traces.
  await cacheSet(
    cacheKey,
    report,
    report.traces.length > 0 ? TTL.captures : TTL.capturesPartial
  );
  if (report.traces.length > 0) await persistReport(report);
  else logger.info("identity: no traces found", { key: report.key });
  return report;
}

/** Confidence re-assessment for external callers (e.g. AI narratives). */
export function assess(traces: IdentityTraceItem[]): ConfidenceAssessment {
  return assessConfidence(confidenceInput(traces));
}
