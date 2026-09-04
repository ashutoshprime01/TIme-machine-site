// Historical viewer (plan §10–11): archived page in a sandboxed frame,
// snapshot navigation, source attribution (§68), measurements and DNA.

import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { archive, ArchiveError } from "@/lib/archive";
import { analyzeCapture, AnalysisUnavailableError } from "@/lib/analysis/service";
import { validateDomain, formatCaptureDate, isCdxTimestamp } from "@/lib/security/url";
import { ViewerFrame } from "@/components/snapshot-viewer/ViewerFrame";
import { Timeline } from "@/components/timeline/Timeline";
import { MetricsPanel } from "@/components/metrics/MetricsPanel";
import { DnaBars } from "@/components/dna/DnaBars";
import type { Capture } from "@/lib/types";

async function getCaptures(domain: string): Promise<Capture[]> {
  return archive.searchCaptures(domain);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; timestamp: string }>;
}): Promise<Metadata> {
  const { domain: raw, timestamp } = await params;
  const domain = decodeURIComponent(raw).toLowerCase();
  const year = timestamp.slice(0, 4);
  return {
    title: `${domain} in ${year}`,
    description: `Archived snapshot of ${domain} captured in ${year}, with measurements and Internet DNA.`,
    alternates: { canonical: `/entity/${domain}/snapshot/${timestamp}` },
    openGraph: { title: `${domain} in ${year} — Internet Time Machine`, type: "website" },
  };
}

/** Viewer + controls render immediately; analysis streams in when ready. */
async function AnalysisSection({
  domain,
  timestamp,
}: {
  domain: string;
  timestamp: string;
}) {
  let result;
  try {
    result = await analyzeCapture(domain, timestamp);
  } catch (err) {
    const userMessage =
      err instanceof AnalysisUnavailableError || err instanceof ArchiveError
        ? err.userMessage
        : "We couldn't analyze this snapshot. Please try again in a moment.";
    return (
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold">Analysis unavailable</h2>
        <p className="mt-2 text-sm text-mist">{userMessage}</p>
        <p className="mt-2 text-xs text-faint">
          You can still browse the archived page above — only the measurements
          are unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <MetricsPanel metrics={result.analysis.metrics} />
      <section aria-labelledby="dna-heading" className="space-y-3">
        <h2 id="dna-heading" className="text-lg font-semibold">
          Internet DNA
        </h2>
        <DnaBars dna={result.analysis.dna} />
      </section>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <p className="text-sm text-mist">Analyzing snapshot… calculating Internet DNA…</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-raised animate-pulse-soft" />
        ))}
      </div>
    </div>
  );
}

export default async function SnapshotPage({
  params,
}: {
  params: Promise<{ domain: string; timestamp: string }>;
}) {
  const { domain: raw, timestamp } = await params;
  const domain = decodeURIComponent(raw).toLowerCase();
  const validation = validateDomain(domain);

  if (!validation.ok || !validation.domain || !isCdxTimestamp(timestamp)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Snapshot not found</h1>
        <p className="mt-3 text-mist">That doesn&apos;t look like a valid archive reference.</p>
        <Link href={`/entity/${domain}`} className="mt-6 inline-block text-amber-bright underline underline-offset-4">
          Back to {domain}
        </Link>
      </div>
    );
  }

  let captures: Capture[] = [];
  try {
    captures = await getCaptures(domain);
  } catch {
    // viewer can still attempt to render below; navigation may be unavailable
  }

  const current =
    captures.find((c) => c.timestamp === timestamp) ??
    archive.nearestCapture(captures, timestamp);
  if (!current) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">No captures available</h1>
        <p className="mt-3 text-mist">
          We couldn&apos;t find archived captures for {domain}.
        </p>
        <Link href="/" className="mt-6 inline-block text-amber-bright underline underline-offset-4">
          Search another website
        </Link>
      </div>
    );
  }

  const idx = captures.indexOf(current);
  const prev = idx > 0 ? captures[idx - 1] : null;
  const next = idx < captures.length - 1 ? captures[idx + 1] : null;
  const replayUrl = archive.replayUrl(current.original, current.timestamp);
  const sourceUrl = `https://web.archive.org/web/${current.timestamp}/${current.original}`;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/entity/${domain}`}
            className="font-mono text-xs uppercase tracking-[0.2em] text-faint hover:text-mist transition-colors"
          >
            ← {domain}
          </Link>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
            {formatCaptureDate(current.timestamp)}
          </h1>
        </div>

        {/* snapshot navigation (plan §11) */}
        <nav aria-label="Snapshot navigation" className="flex items-center gap-2">
          {prev ? (
            <Link
              href={`/entity/${domain}/snapshot/${prev.timestamp}`}
              className="chip-poly !text-sm !normal-case !tracking-normal !px-3 !py-2"
            >
              ⇦ Previous
            </Link>
          ) : (
            <span className="chip-poly !text-sm !normal-case !tracking-normal !px-3 !py-2 opacity-50">
              ⇦ Previous
            </span>
          )}
          {next ? (
            <Link
              href={`/entity/${domain}/snapshot/${next.timestamp}`}
              className="chip-poly !text-sm !normal-case !tracking-normal !px-3 !py-2"
            >
              Next ⇨
            </Link>
          ) : (
            <span className="chip-poly !text-sm !normal-case !tracking-normal !px-3 !py-2 opacity-50">
              Next ⇨
            </span>
          )}
          <Link
            href={`/entity/${domain}/compare?a=${current.timestamp}&b=${captures[captures.length - 1].timestamp}`}
            className="rounded-lg border border-amber text-amber-bright px-3 py-2 text-sm hover:bg-amber/10 transition-colors"
          >
            Compare
          </Link>
        </nav>
      </div>

      <div className="mt-6 space-y-8">
        {/* the archived page itself */}
        <ViewerFrame
          src={replayUrl}
          title={`Archived ${domain} page from ${formatCaptureDate(current.timestamp)}`}
          footer={
            // source attribution (plan §68)
            <dl className="grid gap-x-6 gap-y-1 glass rounded-lg px-4 py-3 text-xs text-mist sm:grid-cols-4">
              <div>
                <dt className="text-faint">Source</dt>
                <dd className="mt-0.5">Internet Archive (Wayback Machine)</dd>
              </div>
              <div>
                <dt className="text-faint">Captured</dt>
                <dd className="mt-0.5">{formatCaptureDate(current.timestamp)}</dd>
              </div>
              <div>
                <dt className="text-faint">Original URL</dt>
                <dd className="mt-0.5 truncate">{current.original}</dd>
              </div>
              <div>
                <dt className="text-faint">Source capture</dt>
                <dd className="mt-0.5">
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-fog"
                  >
                    View on archive.org ↗
                  </a>
                </dd>
              </div>
            </dl>
          }
        />

        {/* year jump */}
        <section aria-label="Jump to another year">
          <Timeline domain={domain} captures={captures} activeTimestamp={current.timestamp} />
        </section>

        {/* measurements + DNA */}
        <Suspense key={current.timestamp} fallback={<AnalysisSkeleton />}>
          <AnalysisSection domain={domain} timestamp={current.timestamp} />
        </Suspense>
      </div>
    </div>
  );
}
