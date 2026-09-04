// Entity page (plan §9): the central history page for a website.

import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { archive, ArchiveError } from "@/lib/archive";
import { validateDomain, formatCaptureDate } from "@/lib/security/url";
import { Timeline } from "@/components/timeline/Timeline";

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

async function EntityBody({ domain }: { domain: string }) {
  let summary;
  try {
    summary = await archive.getCaptureSummary(domain);
  } catch (err) {
    if (err instanceof ArchiveError) {
      return (
        <div className="rounded-xl border border-line bg-panel p-8 text-center">
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
      <div className="rounded-xl border border-line bg-panel p-8 text-center space-y-4">
        <h2 className="text-lg font-semibold">
          No archived captures found for {domain}
        </h2>
        <p className="text-sm text-mist">
          Possible reasons: the site is too new, was rarely crawled, or blocks
          archiving.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/" className="rounded-lg border border-line px-4 py-2 text-mist hover:text-fog">
            Search another website
          </Link>
          <Link
            href="/entity/google.com"
            className="rounded-lg border border-line px-4 py-2 text-mist hover:text-fog"
          >
            Explore a popular website
          </Link>
        </div>
      </div>
    );
  }

  const first = captures[0];
  const latest = captures[captures.length - 1];

  return (
    <div className="space-y-10">
      {!summary.complete && (
        <div
          role="status"
          className="rounded-xl border border-amber/40 bg-amber/10 px-5 py-3 text-sm text-amber-bright"
        >
          Some periods couldn&apos;t be retrieved from the archive just now —
          this timeline may be incomplete. Try again in a little while.
        </div>
      )}

      {/* header stats */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "First capture", value: formatCaptureDate(first.timestamp) },
          { label: "Latest capture", value: formatCaptureDate(latest.timestamp) },
          { label: "Captures found", value: String(captures.length) },
          { label: "Archive source", value: archive.providerName() },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-panel px-4 py-3">
            <dd className="font-semibold tabular-nums">{s.value}</dd>
            <dt className="text-xs text-faint mt-0.5">{s.label}</dt>
          </div>
        ))}
      </dl>

      {/* main actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/entity/${domain}/snapshot/${first.timestamp}`}
          className="rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-ink hover:bg-amber-bright transition-colors"
        >
          ⇦ Travel to {first.timestamp.slice(0, 4)}
        </Link>
        <Link
          href={`/entity/${domain}/snapshot/${latest.timestamp}`}
          className="rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-ink hover:bg-amber-bright transition-colors"
        >
          Travel to {latest.timestamp.slice(0, 4)} ⇨
        </Link>
        <Link
          href={`/entity/${domain}/compare?a=${first.timestamp}&b=${latest.timestamp}`}
          className="rounded-lg border border-amber text-amber-bright px-5 py-2.5 text-sm font-semibold hover:bg-amber/10 transition-colors"
        >
          Compare {first.timestamp.slice(0, 4)} vs {latest.timestamp.slice(0, 4)}
        </Link>
        <Link
          href={`/entity/${domain}/evolution`}
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-mist hover:text-fog hover:border-amber/50 transition-colors"
        >
          Evolution report ↗
        </Link>
        <Link
          href={`/entity/${domain}/lab`}
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-mist hover:text-fog hover:border-amber/50 transition-colors"
        >
          Evolution Lab ⚗
        </Link>
        <Link
          href={`/entity/${domain}/future`}
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-mist hover:text-fog hover:border-amber/50 transition-colors"
        >
          Future scenarios 🔮
        </Link>
      </div>

      {/* timeline */}
      <section aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="text-lg font-semibold mb-4">
          Timeline
        </h2>
        <Timeline domain={domain} captures={captures} />
      </section>

      {/* notable captures */}
      <section aria-labelledby="notable-heading">
        <h2 id="notable-heading" className="text-lg font-semibold mb-4">
          Notable captures
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pickNotable(captures).map((c) => (
            <li key={c.timestamp}>
              <Link
                href={`/entity/${domain}/snapshot/${c.timestamp}`}
                className="block rounded-xl border border-line bg-panel p-4 hover:border-amber/50 hover:bg-raised transition-colors"
              >
                <div className="font-semibold tabular-nums">
                  {formatCaptureDate(c.timestamp)}
                </div>
                <div className="mt-1 text-xs text-faint truncate">
                  {c.original}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Evenly spread sample of captures across the site's history. */
function pickNotable<T>(items: T[], count = 6): T[] {
  if (items.length <= count) return items;
  const picked: T[] = [items[0]];
  for (let i = 1; i < count - 1; i++) {
    picked.push(items[Math.round((i * (items.length - 1)) / (count - 1))]);
  }
  picked.push(items[items.length - 1]);
  return [...new Map(picked.map((x) => [JSON.stringify(x), x])).values()];
}

function TimelineSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl border border-line bg-panel animate-pulse-soft" />
        ))}
      </div>
      <p className="text-center text-sm text-mist">Finding historical captures…</p>
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
          className="mt-6 inline-block rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-ink"
        >
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-faint">Entity</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">{domain}</h1>
      </header>
      <Suspense fallback={<TimelineSkeleton />}>
        <EntityBody domain={domain} />
      </Suspense>
    </div>
  );
}
