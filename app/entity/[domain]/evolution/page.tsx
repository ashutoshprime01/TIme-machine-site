// Evolution page (plan §17–19, §46): cross-year charts, evolution score,
// and detected events — every claim labeled FACT or INFERENCE.

import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { validateDomain } from "@/lib/security/url";
import { buildEvolutionReport, type EvolutionEvent, type YearPoint } from "@/lib/analysis/evolution";
import { EvolutionChart, type ChartPoint } from "@/components/evolution/EvolutionChart";

const TYPE_LABELS: Record<EvolutionEvent["type"], string> = {
  content: "Content change",
  structure: "Structure change",
  navigation: "Navigation change",
  technology: "Technology change",
};

/** Build the chart's flat values record from metrics + DNA of a year. */
function toChartPoint(p: YearPoint): ChartPoint {
  return {
    year: p.year,
    values: {
      wordCount: p.metrics.wordCount,
      linkCount: p.metrics.linkCount,
      imageCount: p.metrics.imageCount,
      domNodes: p.metrics.domNodes,
      minimalism: p.dna.minimalism,
      informationDensity: p.dna.informationDensity,
      commercialization: p.dna.commercialization,
      mobileFocus: p.dna.mobileFocus,
      mediaIntensity: p.dna.mediaIntensity,
    },
  };
}

async function EvolutionBody({ domain }: { domain: string }) {
  const report = await buildEvolutionReport(domain);

  if (report.points.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-panel p-8 text-center space-y-4">
        <h2 className="text-lg font-semibold">Not enough history to analyze yet</h2>
        <p className="text-sm text-mist">
          We analyze one archived page per year. For {domain}, either no year could
          be analyzed right now, or the archive has too little to compare.
        </p>
        <Link
          href={`/entity/${domain}`}
          className="inline-block rounded-lg border border-line px-4 py-2 text-sm text-mist hover:text-fog"
        >
          Back to the timeline
        </Link>
      </div>
    );
  }

  if (report.points.length === 1) {
    const only = report.points[0];
    return (
      <div className="rounded-xl border border-line bg-panel p-8 text-center space-y-4">
        <h2 className="text-lg font-semibold">Only one year of history so far</h2>
        <p className="text-sm text-mist">
          Evolution needs at least two years to compare. {domain} has analyzable
          captures from {only.year} only.
        </p>
        <Link
          href={`/entity/${domain}/snapshot/${only.timestamp}`}
          className="inline-block rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-ink"
        >
          View the {only.year} snapshot
        </Link>
      </div>
    );
  }

  const first = report.points[0];
  const last = report.points[report.points.length - 1];
  const chartPoints = report.points.map(toChartPoint);

  return (
    <div className="space-y-10">
      {!report.complete && (
        <div
          role="status"
          className="rounded-xl border border-amber/40 bg-amber/10 px-5 py-3 text-sm text-amber-bright"
        >
          Some years couldn&apos;t be analyzed just now — this report covers the{" "}
          {report.points.length} years that succeeded. Try again in a little while
          for the full picture.
        </div>
      )}

      {/* evolution score (plan §18) */}
      <section aria-labelledby="score-heading">
        <h2 id="score-heading" className="text-lg font-semibold mb-4">
          Evolution score
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-amber/40 bg-amber/10 px-4 py-3">
            <dd className="text-2xl font-bold tabular-nums text-amber-bright">
              {report.overallIndex}
            </dd>
            <dt className="text-xs text-faint mt-1">
              Evolution Index · {first.year} → {last.year}
            </dt>
          </div>
          {report.overallComparison &&
            (
              [
                ["Content change", report.overallComparison.contentChange],
                ["Structure change", report.overallComparison.structureChange],
                ["Technology change", report.overallComparison.technologyChange],
              ] as Array<[string, number]>
            ).map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-panel px-4 py-3">
                <dd className="text-2xl font-bold tabular-nums">{value}</dd>
                <dt className="text-xs text-faint mt-1">{label}</dt>
              </div>
            ))}
        </div>
        <p className="mt-3 text-xs text-faint">
          <span className="font-semibold text-mist">INFERENCE</span> — the index
          combines measured content, structure, navigation and technology deltas
          between {first.year} and {last.year} into one 0–100 score. The
          measurements are facts; the single number is an interpretation.
        </p>
      </section>

      {/* cross-year chart (plan §46) */}
      <section aria-labelledby="chart-heading">
        <h2 id="chart-heading" className="text-lg font-semibold mb-4">
          How it changed, year by year
        </h2>
        <div className="rounded-xl border border-line bg-panel p-4 sm:p-6">
          <EvolutionChart points={chartPoints} />
        </div>
        <p className="mt-3 text-xs text-faint">
          <span className="font-semibold text-mist">FACT</span> — values are
          deterministic counts from one archived page per year (the capture
          closest to July 1), measured by Analysis v1.0.
        </p>
      </section>

      {/* detected events (plan §19) */}
      <section aria-labelledby="events-heading">
        <h2 id="events-heading" className="text-lg font-semibold mb-4">
          Detected events
        </h2>
        {report.events.length === 0 ? (
          <div className="rounded-xl border border-line bg-panel p-6 text-sm text-mist">
            No major year-over-year changes crossed our detection threshold
            during this period. The site changed gradually rather than in
            dramatic steps.
          </div>
        ) : (
          <ol className="space-y-4">
            {report.events.map((e) => (
              <li
                key={`${e.timestampA}-${e.timestampB}-${e.type}`}
                className="rounded-xl border border-line bg-panel p-5"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="font-semibold tabular-nums">
                    {e.yearA} → {e.yearB}
                  </span>
                  <span className="rounded-full border border-amber/40 bg-amber/10 px-2.5 py-0.5 text-xs font-medium text-amber-bright">
                    {TYPE_LABELS[e.type]}
                  </span>
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-mist">
                    {e.confidence} confidence
                  </span>
                  <span className="ml-auto text-xs text-faint tabular-nums">
                    magnitude {e.magnitude}/100
                  </span>
                </div>

                <div
                  className="mt-3 h-1.5 w-full max-w-md rounded-full bg-meter-track"
                  role="img"
                  aria-label={`${TYPE_LABELS[e.type]} magnitude ${e.magnitude} out of 100`}
                >
                  <div
                    className="h-1.5 rounded-full bg-amber"
                    style={{ width: `${Math.min(e.magnitude, 100)}%` }}
                  />
                </div>

                <ul className="mt-4 space-y-1.5 text-sm">
                  {e.changes.slice(0, 4).map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span
                        className={`mt-0.5 shrink-0 rounded border px-1.5 py-px text-[10px] font-semibold tracking-wide ${
                          c.status === "FACT"
                            ? "border-azure/50 text-azure"
                            : "border-line text-faint"
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="text-mist">{c.text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/entity/${domain}/compare?a=${e.timestampA}&b=${e.timestampB}`}
                  className="mt-4 inline-block text-sm font-medium text-amber-bright hover:underline"
                >
                  Compare {e.yearA} vs {e.yearB} →
                </Link>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-faint">
          <span className="font-semibold text-mist">INFERENCE</span> — an event is
          flagged when a change dimension between two consecutive years crosses a
          fixed threshold (35/100). We call these &ldquo;detected changes&rdquo;,
          not redesigns: the underlying measurements are facts, the event
          boundary is our interpretation.
        </p>
      </section>

      {/* methodology */}
      <footer className="rounded-xl border border-line bg-panel p-5 text-xs leading-relaxed text-faint">
        <p>
          Method: one archived capture per year (closest to July 1) is fetched
          from {`${domain}`}
          &apos;s archive history and analyzed deterministically (Analysis v1.0,
          DNA v1.0). Adjacent years are compared on content, structure,
          navigation and technology. All results are reproducible — the same
          snapshots always produce the same scores.{" "}
          <Link href="/about" className="text-mist underline hover:text-fog">
            Read the full methodology
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}

function EvolutionSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl border border-line bg-panel animate-pulse-soft" />
        ))}
      </div>
      <p className="text-center text-sm text-mist">
        Analyzing one page per year — this can take a moment the first time…
      </p>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain: raw } = await params;
  const domain = decodeURIComponent(raw).toLowerCase();
  return {
    title: `${domain} Evolution`,
    description: `Year-by-year evolution of ${domain}: charts, evolution score and detected change events.`,
    alternates: { canonical: `/entity/${domain}/evolution` },
  };
}

export default async function EvolutionPage({
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
        <p className="text-xs uppercase tracking-[0.2em] text-faint">Evolution</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">
          How {domain} evolved
        </h1>
        <Link
          href={`/entity/${domain}`}
          className="mt-2 inline-block text-sm text-mist hover:text-fog"
        >
          ← Timeline
        </Link>
      </header>
      <Suspense fallback={<EvolutionSkeleton />}>
        <EvolutionBody domain={domain} />
      </Suspense>
    </div>
  );
}
