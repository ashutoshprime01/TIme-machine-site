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
      <div className="glass rounded-xl p-8 text-center space-y-4">
        <h2 className="text-lg font-semibold">Not enough history to analyze yet</h2>
        <p className="text-sm text-mist">
          We analyze one archived page per year. For {domain}, either no year could
          be analyzed right now, or the archive has too little to compare.
        </p>
        <Link
          href={`/entity/${domain}`}
          className="btn-ghost px-4 py-2 text-sm font-semibold"
        >
          Back to the timeline
        </Link>
      </div>
    );
  }

  if (report.points.length === 1) {
    const only = report.points[0];
    return (
      <div className="glass rounded-xl p-8 text-center space-y-4">
        <h2 className="text-lg font-semibold">Only one year of history so far</h2>
        <p className="text-sm text-mist">
          Evolution needs at least two years to compare. {domain} has analyzable
          captures from {only.year} only.
        </p>
        <Link
          href={`/entity/${domain}/snapshot/${only.timestamp}`}
          className="btn-primary px-5 py-2.5 text-sm"
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
        <p className="eyebrow">Evolution score</p>
        <h2 id="score-heading" className="text-xl sm:text-2xl font-bold tracking-tight mb-5">
          How much it changed overall
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass rounded-xl px-4 py-3.5 border-amber/40 bg-amber/10 card-hover">
            <dd className="text-3xl font-bold tabular-nums text-amber-bright">
              {report.overallIndex}
            </dd>
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint mt-1">
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
              <div key={label} className="glass rounded-xl px-4 py-3.5 card-hover">
                <dd className="text-2xl font-bold tabular-nums">{value}</dd>
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint mt-1">{label}</dt>
              </div>
            ))}
        </div>
        <p className="mt-3 text-xs text-faint">
          <span className="chip chip-inference mr-1.5">INFERENCE</span> the index
          combines measured content, structure, navigation and technology deltas
          between {first.year} and {last.year} into one 0–100 score. The
          measurements are facts; the single number is an interpretation.
        </p>
      </section>

      {/* cross-year chart (plan §46) */}
      <section aria-labelledby="chart-heading">
        <p className="eyebrow">Year by year</p>
        <h2 id="chart-heading" className="text-xl sm:text-2xl font-bold tracking-tight mb-5">
          How it changed, year by year
        </h2>
        <div className="glass rounded-xl p-4 sm:p-6">
          <EvolutionChart points={chartPoints} />
        </div>
        <p className="mt-3 text-xs text-faint">
          <span className="chip chip-fact mr-1.5">FACT</span> values are
          deterministic counts from one archived page per year (the capture
          closest to July 1), measured by Analysis v1.0.
        </p>
      </section>

      {/* detected events (plan §19) */}
      <section aria-labelledby="events-heading">
        <p className="eyebrow">Detected events</p>
        <h2 id="events-heading" className="text-xl sm:text-2xl font-bold tracking-tight mb-5">
          When the site shifted
        </h2>
        {report.events.length === 0 ? (
          <div className="glass rounded-xl p-6 text-sm text-mist">
            No major year-over-year changes crossed our detection threshold
            during this period. The site changed gradually rather than in
            dramatic steps.
          </div>
        ) : (
          <ol className="space-y-4">
            {report.events.map((e) => (
              <li
                key={`${e.timestampA}-${e.timestampB}-${e.type}`}
                className="glass rounded-xl p-5 card-hover"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="font-mono font-semibold tabular-nums text-lg">
                    {e.yearA} → {e.yearB}
                  </span>
                  <span className="chip chip-hypothesis">{TYPE_LABELS[e.type]}</span>
                  <span className="chip chip-inference">{e.confidence} confidence</span>
                  <span className="ml-auto font-mono text-xs text-faint tabular-nums">
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
                      <span className={`chip mt-0.5 shrink-0 ${c.status === "FACT" ? "chip-fact" : "chip-inference"}`}>
                        {c.status}
                      </span>
                      <span className="text-mist">{c.text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/entity/${domain}/compare?a=${e.timestampA}&b=${e.timestampB}`}
                  className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.15em] text-amber-bright hover:underline"
                >
                  Compare {e.yearA} vs {e.yearB}
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-faint">
          <span className="chip chip-inference mr-1.5">INFERENCE</span> an event is
          flagged when a change dimension between two consecutive years crosses a
          fixed threshold (35/100). We call these &ldquo;detected changes&rdquo;,
          not redesigns: the underlying measurements are facts, the event
          boundary is our interpretation.
        </p>
      </section>

      {/* methodology */}
      <footer className="glass rounded-xl p-5 text-xs leading-relaxed text-faint">
        <p>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-mist/60">Method</span>
          <br />
          One archived capture per year (closest to July 1) is fetched
          from {`${domain}`}
          &apos;s archive history and analyzed deterministically (Analysis v1.0,
          DNA v1.0). Adjacent years are compared on content, structure,
          navigation and technology. All results are reproducible — the same
          snapshots always produce the same scores.{" "}
          <Link href="/about" className="text-mist underline underline-offset-2 hover:text-fog">
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
          <div key={i} className="h-16 glass rounded-xl animate-pulse-soft" />
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
          className="btn-primary mt-6 px-5 py-2.5 text-sm"
        >
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <header className="mb-10">
        <p className="eyebrow eyebrow-accent">Evolution</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
          How {domain}{" "}
          <span className="font-light italic text-fog/80">evolved</span>
        </h1>
        <div className="mt-3 flex items-center flex-wrap gap-x-3 gap-y-2">
          <Link
            href={`/entity/${domain}`}
            className="font-mono text-xs uppercase tracking-[0.15em] text-mist hover:text-fog transition-colors"
          >
            ← Timeline
          </Link>
          <span className="text-faint" aria-hidden="true">·</span>
          <Link
            href={`/entity/${domain}/lab`}
            className="font-mono text-xs uppercase tracking-[0.15em] text-amber-bright hover:underline"
          >
            Run a hypothetical transformation in the Evolution Lab →
          </Link>
        </div>
      </header>
      <Suspense fallback={<EvolutionSkeleton />}>
        <EvolutionBody domain={domain} />
      </Suspense>
    </div>
  );
}
