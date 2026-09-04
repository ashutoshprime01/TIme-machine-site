// Entity page (plan §9): the Intelligence OS view — a full-screen 3D
// particle timeline with floating HUD panels (search, scrubber, DNA,
// target) and off-canvas Lab/Compare drawers. Server data (captures,
// measured DNA) is fetched here and handed to the client shell.

import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { archive, ArchiveError } from "@/lib/archive";
import { validateDomain } from "@/lib/security/url";
import { analyzeCapture } from "@/lib/analysis/service";
import { prisma } from "@/lib/db";
import { OsShell } from "@/components/os/OsShell";
import type { DnaProfile } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain: raw } = await params;
  const domain = decodeURIComponent(raw).toLowerCase();
  const pretty = domain.replace(/\.(com|org|net|io|co|edu|gov)$/i, "");
  const title = `${pretty.charAt(0).toUpperCase() + pretty.slice(1)} Through Time`;
  return {
    title,
    description: `Explore how ${domain} changed over the years — archived snapshots, comparisons and measurable evolution.`,
    alternates: { canonical: `/entity/${domain}` },
    openGraph: { title: `${title} — Internet Time Machine`, type: "website" },
  };
}

/** Latest stored (or freshly computed) DNA profile for the domain. */
async function latestDna(domain: string): Promise<DnaProfile | null> {
  try {
    const captures = await archive.searchCaptures(domain);
    const latest = captures[captures.length - 1];
    if (!latest) return null;
    const { analysis } = await analyzeCapture(domain, latest.timestamp);
    return analysis.dna;
  } catch {
    // analysis is best-effort here — the OS works without the DNA panel
    return null;
  }
}

async function EntityBody({ domain }: { domain: string }) {
  let summary;
  try {
    summary = await archive.getCaptureSummary(domain);
  } catch (err) {
    if (err instanceof ArchiveError) {
      return (
        <div className="glass rounded-xl p-8 text-center">
          <h2 className="text-lg font-semibold">We couldn&apos;t retrieve captures right now</h2>
          <p className="mt-2 text-sm text-mist">{err.userMessage}</p>
        </div>
      );
    }
    throw err;
  }

  const { capturesByYear, years } = summary;
  const captures = years.flatMap((y) => capturesByYear[y]);

  if (captures.length === 0) {
    // Empty state (plan §80)
    return (
      <div className="glass rounded-xl p-8 text-center space-y-4">
        <h2 className="text-lg font-semibold">
          No archived captures found for {domain}
        </h2>
        <p className="text-sm text-mist">
          Possible reasons: the site is too new, was rarely crawled, or blocks
          archiving.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/" className="btn-ghost px-4 py-2 text-sm font-semibold">
            Search another website
          </Link>
          <Link
            href="/entity/google.com"
            className="btn-ghost px-4 py-2 text-sm font-semibold"
          >
            Explore a popular website
          </Link>
        </div>
      </div>
    );
  }

  const first = captures[0];
  const latest = captures[captures.length - 1];
  const dna = await latestDna(domain);

  return (
    <OsShell
      domain={domain}
      years={years.map(Number)}
      firstTimestamp={first.timestamp}
      latestTimestamp={latest.timestamp}
      dna={dna}
      labContent={null}
      compareContent={null}
    />
  );
}

function TimelineSkeleton() {
  return (
    <div className="h-[calc(100vh-5rem)] min-h-[620px] flex items-center justify-center" role="status" aria-live="polite">
      <p className="font-mono text-sm text-mist animate-pulse-soft">
        ESTABLISHING UPLINK · RETRIEVING ARCHIVE HISTORY…
      </p>
    </div>
  );
}

export default async function EntityPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: raw } = await params;
  const domain = decodeURIComponent(raw).toLowerCase();
  const validation = validateDomain(domain);

  if (!validation.ok) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Not a valid website</h1>
        <p className="mt-3 text-mist">{validation.error}</p>
        <Link
          href="/"
          className="btn-primary mt-6 px-5 py-2.5 text-sm"
        >
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
      <header className="mb-6">
        <p className="eyebrow eyebrow-accent">Entity</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight font-display">{domain}</h1>
      </header>
      <Suspense fallback={<TimelineSkeleton />}>
        <EntityBody domain={domain} />
      </Suspense>
      {/* classic timeline below the OS for accessibility & deep links */}
      <section aria-labelledby="timeline-heading" className="mt-10">
        <p className="eyebrow">Full timeline</p>
        <h2 id="timeline-heading" className="mt-1 text-xl sm:text-2xl font-bold tracking-tight mb-5">
          {domain} through the years
        </h2>
        <ClassicTimeline domain={domain} />
      </section>
    </div>
  );
}

/** Server-rendered year grid — the accessible fallback under the OS. */
async function ClassicTimeline({ domain }: { domain: string }) {
  let summary;
  try {
    summary = await archive.getCaptureSummary(domain);
  } catch {
    return (
      <p className="text-sm text-mist">
        Timeline temporarily unavailable — the archive didn&apos;t respond.
      </p>
    );
  }
  const { capturesByYear, years } = summary;
  return (
    <ol className="flex flex-wrap gap-2.5">
      {years.map((y) => {
        const firstOfYear = capturesByYear[y][0];
        return (
          <li key={y}>
            <Link
              href={`/entity/${domain}/snapshot/${firstOfYear.timestamp}`}
              className="chip-poly !text-sm !normal-case !tracking-normal tabular-nums"
            >
              {y}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
