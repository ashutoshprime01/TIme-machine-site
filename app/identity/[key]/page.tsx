// Identity History page (ITM 2.0) — reconstructs the publicly discoverable
// timeline of a name / handle / alias / domain. Everything shown is sourced
// public evidence with confidence labels; the page states clearly that this
// is not a person's complete Internet history.

import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import {
  getIdentityReport,
  IdentityUnavailableError,
} from "@/lib/identity/engine";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { captureYear, formatCaptureDate } from "@/lib/security/url";
import { getAI } from "@/lib/ai";
import type { IdentityReport } from "@/lib/types";
import { SearchBar } from "@/components/SearchBar";
import { StatusBadge } from "@/components/StatusBadge";
import { DiscoverySequence } from "@/components/identity/DiscoverySequence";
import { IdentityTimeline } from "@/components/identity/IdentityTimeline";
import { UsernameHistory } from "@/components/identity/UsernameHistory";
import { TraceSection } from "@/components/identity/TraceSection";
import { ConfidenceBadge } from "@/components/identity/ConfidenceBadge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const label = decodeURIComponent(key);
  const title = `Public identity: ${label}`;
  return {
    title,
    description: `Publicly discoverable Internet traces associated with ${label} — evidence, sources and confidence for every discovery.`,
    alternates: { canonical: `/identity/${key}` },
  };
}

/** Identity evolution observations — each labeled FACT / INFERENCE / HYPOTHESIS. */
async function buildObservations(report: IdentityReport) {
  const ai = getAI();
  const [summary, hypothesis] = await Promise.all([
    ai.summarize(report),
    ai.generateHypothesis(report),
  ]);

  const observations: { status: "FACT" | "INFERENCE" | "HYPOTHESIS"; text: string }[] = [];

  if (report.traces.length > 0) {
    const first = report.traces[0];
    observations.push({
      status: "FACT",
      text: `The earliest trace in this report is a direct observation: “${first.title}”, first observed ${formatCaptureDate(first.observedAt)} via ${first.source}.`,
    });
    if (report.traces.length > 1) {
      const last = report.traces[report.traces.length - 1];
      observations.push({
        status: "FACT",
        text: `${report.traces.length} public traces were observed, the latest being “${last.title}” (${formatCaptureDate(last.observedAt)}).`,
      });
    }
  }

  if (report.confidence.breakdown.length > 0) {
    observations.push({
      status: "INFERENCE",
      text: `Public evidence groups these traces under this search with ${report.confidence.level.toLowerCase()} confidence (score ${report.confidence.score}): ${report.confidence.breakdown
        .map((b) => `${b.signal.toLowerCase()} (${b.weight > 0 ? "+" : ""}${b.weight})`)
        .join("; ")}.`,
    });
  }

  observations.push(hypothesis);
  return { summary, observations };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">{label}</dt>
      <dd className="mt-1 font-mono text-sm tabular-nums text-fog">{value}</dd>
    </div>
  );
}

export default async function IdentityPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key: rawKey } = await params;
  const input = decodeURIComponent(rawKey);

  // Rate limit fresh discovery work per client.
  const hdrs = await headers();
  const rl = rateLimit(`identity:${clientIp(hdrs)}`, 12, 60_000);
  if (!rl.allowed) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Too many searches</h1>
        <p className="mt-3 text-mist">
          Identity searches query public archives on your behalf, so they are
          rate-limited. Please wait {rl.retryAfterSeconds}s and try again.
        </p>
      </div>
    );
  }

  let report: IdentityReport;
  try {
    report = await getIdentityReport(input);
  } catch (err) {
    if (err instanceof IdentityUnavailableError) {
      return (
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Let&apos;s try that again</h1>
          <p className="mt-3 text-mist">{err.userMessage}</p>
          <div className="mt-8">
            <SearchBar initialValue={input} mode="identity" />
          </div>
        </div>
      );
    }
    throw err;
  }

  const counts = {
    profiles: report.traces.filter((t) => t.type === "PROFILE").length,
    websites: report.traces.filter((t) => t.type === "WEBSITE").length,
    domains: report.traces.filter((t) => t.type === "DOMAIN").length,
    mentions: report.traces.filter((t) => t.type === "MENTION").length,
  };

  const { summary, observations } = await buildObservations(report);

  const content = (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-24">
      {/* ── header ─────────────────────────────────────────────── */}
      <header className="pt-14 sm:pt-20">
        <p className="eyebrow">Public identity</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-balance">
          {report.displayName}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-mist leading-relaxed">
          {summary}
        </p>
        <p className="mt-2 max-w-2xl text-xs text-faint">
          Publicly discoverable traces found by this system — not a person&apos;s
          complete Internet history, and never a claim of identity.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-6 rounded-2xl border border-white/10 bg-panel/60 p-6 sm:grid-cols-3 lg:grid-cols-6">
          <Stat
            label="First observed"
            value={report.firstObservedAt ? captureYear(report.firstObservedAt) : "—"}
          />
          <Stat
            label="Latest observed"
            value={report.lastObservedAt ? captureYear(report.lastObservedAt) : "—"}
          />
          <Stat label="Public traces" value={String(report.traces.length)} />
          <Stat label="Profiles" value={String(counts.profiles)} />
          <Stat label="Websites" value={String(counts.websites + counts.domains)} />
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Confidence</dt>
            <dd className="mt-1"><ConfidenceBadge level={report.confidence.level} /></dd>
          </div>
        </dl>
      </header>

      {report.traces.length === 0 ? (
        /* ── honest empty state ─────────────────────────────────── */
        <section className="mt-16 rounded-2xl border border-dashed border-white/15 bg-panel/40 p-8 sm:p-12 text-center">
          <h2 className="text-lg font-semibold">
            No publicly discoverable traces found
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-mist leading-relaxed">
            We searched the public sources this system is permitted to query and
            found nothing for <span className="text-fog">{report.displayName}</span>.
            That is the honest result — nothing was invented to fill the page.
          </p>
          <ul className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2">
            {report.sourcesQueried.map((s) => (
              <li
                key={s}
                className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint"
              >
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-faint">
            Possible reasons: the handle is rare, the pages were never archived,
            or they live behind logins this system will never bypass.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/identity/torvalds" className="btn-ghost px-4 py-2 text-sm font-semibold">
              Try a documented example
            </Link>
            <Link href="/" className="btn-ghost px-4 py-2 text-sm font-semibold">
              Search something else
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* ── timeline ─────────────────────────────────────── */}
          <section aria-labelledby="timeline-heading" className="mt-16">
            <h2 id="timeline-heading" className="text-xl font-bold tracking-tight">
              Public trace timeline
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-mist">
              Every node is a real, dated public artifact. Click any node to
              inspect its full evidence.
            </p>
            <div className="mt-8">
              <IdentityTimeline traces={report.traces} />
            </div>
          </section>

          {/* ── username history ─────────────────────────────── */}
          <section aria-labelledby="username-heading" className="mt-16">
            <h2 id="username-heading" className="text-xl font-bold tracking-tight">
              Username history
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-mist">
              First and last public appearance of each observed alias.
            </p>
            <div className="mt-6">
              <UsernameHistory aliases={report.aliases} />
            </div>
          </section>

          {/* ── trace sections ───────────────────────────────── */}
          <div className="mt-16 space-y-14">
            <TraceSection
              title="Public profiles"
              description="Public profile pages found in archives and public APIs."
              traces={report.traces.filter((t) => t.type === "PROFILE")}
              emptyText="No public profile pages were found in the sources this system searches."
            />
            <TraceSection
              title="Websites & domains"
              description="Websites and domains publicly associated with this identity — where evidence supports the connection. Ownership is never assumed."
              traces={report.traces.filter((t) => t.type === "WEBSITE" || t.type === "DOMAIN")}
              emptyText="No website or domain connections were supported by public evidence."
            />
            <TraceSection
              title="Public mentions"
              description="Pages publicly mentioning this identity, with source, date and context."
              traces={report.traces.filter((t) => t.type === "MENTION" || t.type === "POST")}
              emptyText="No public mentions were found. The current data sources (public archives and the GitHub public API) surface profiles and websites — full-text mention search may arrive in a future phase."
            />
          </div>

          {/* ── relationships ────────────────────────────────── */}
          {report.relationships.length > 0 && (
            <section aria-labelledby="rel-heading" className="mt-16">
              <h2 id="rel-heading" className="text-xl font-bold tracking-tight">
                Observed connections
              </h2>
              <ul className="mt-5 space-y-3">
                {report.relationships.map((r, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-white/10 bg-panel/60 px-4 py-3 text-sm"
                  >
                    <span className="text-fog">{r.sourceTitle}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-bright/80">
                      — {r.type} →
                    </span>
                    <span className="text-fog">{r.targetTitle}</span>
                    <ConfidenceBadge level={r.confidence} />
                    <span className="w-full text-xs text-faint">{r.reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── identity evolution ───────────────────────────── */}
          <section aria-labelledby="evolution-heading" className="mt-16">
            <h2 id="evolution-heading" className="text-xl font-bold tracking-tight">
              Identity evolution
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-mist">
              Evidence-based observations, separated into facts, inferences and
              hypotheses — never mixed.
            </p>
            <ul className="mt-6 space-y-3">
              {observations.map((o, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-start gap-3 rounded-xl border border-white/10 bg-panel/60 px-4 py-3.5"
                >
                  <StatusBadge status={o.status} />
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-mist">{o.text}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* ── confidence methodology ───────────────────────────── */}
      <section aria-labelledby="method-heading" className="mt-16">
        <h2 id="method-heading" className="text-xl font-bold tracking-tight">
          How confidence was assessed
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-mist">
          A published heuristic — not proof. Every signal that fired is listed
          with its weight.
        </p>
        <div className="mt-5 rounded-2xl border border-white/10 bg-panel/60 p-6">
          {report.confidence.breakdown.length === 0 ? (
            <p className="text-sm text-faint">
              No signals fired — the grouping is UNVERIFIED.
            </p>
          ) : (
            <ul className="space-y-2 font-mono text-xs">
              {report.confidence.breakdown.map((b) => (
                <li key={b.signal} className="flex items-baseline justify-between gap-4 border-b border-white/8 pb-2">
                  <span className="text-mist">{b.signal}</span>
                  <span className={b.weight > 0 ? "text-amber-bright" : "text-fuchsia-300"}>
                    {b.weight > 0 ? "+" : ""}
                    {b.weight}
                  </span>
                </li>
              ))}
              <li className="flex items-baseline justify-between gap-4 pt-1">
                <span className="uppercase tracking-[0.16em] text-fog">Total</span>
                <span className="text-fog">{report.confidence.score}</span>
              </li>
            </ul>
          )}
          <p className="mt-4 text-xs text-faint">
            Score 0–2 = LOW · 3–4 = MEDIUM · 5+ = HIGH.{" "}
            <Link href="/about" className="text-azure hover:text-azure/80 underline underline-offset-4">
              Full methodology →
            </Link>
          </p>
        </div>
      </section>

      {/* ── footer actions ───────────────────────────────────── */}
      <div className="mt-14 flex flex-wrap gap-3 border-t border-white/8 pt-8">
        <Link href="/report" className="btn-ghost px-4 py-2 text-sm font-semibold">
          Report / remove a public result
        </Link>
        <Link href="/about" className="btn-ghost px-4 py-2 text-sm font-semibold">
          Methodology & privacy principles
        </Link>
        <Link href="/" className="btn-ghost px-4 py-2 text-sm font-semibold">
          New search
        </Link>
      </div>
    </div>
  );

  return (
    <DiscoverySequence
      counts={{
        displayName: report.displayName,
        profiles: counts.profiles,
        websites: counts.websites,
        domains: counts.domains,
        mentions: counts.mentions,
        totalTraces: report.traces.length,
        sourcesQueried: Math.max(report.sourcesQueried.length, 1),
      }}
    >
      {content}
    </DiscoverySequence>
  );
}
