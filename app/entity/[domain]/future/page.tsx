// Future Mode (plan §24, §49): pick a target year and scenario, see a
// grounded extrapolation of the site's measured trajectory. Everything here
// is HYPOTHESIS — speculation, explicitly never a prediction.

import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildEvolutionReport } from "@/lib/analysis/evolution";
import { buildFutureScenario, getScenario, SCENARIOS, TARGET_YEARS, type ScenarioId } from "@/lib/future/engine";
import { validateDomain } from "@/lib/security/url";
import { DnaBarsCompare } from "@/components/dna/DnaBars";
import type { DnaProfile } from "@/lib/types";

async function FutureBody({
  domain,
  year,
  scenarioId,
}: {
  domain: string;
  year: number | null;
  scenarioId: ScenarioId | null;
}) {
  // The extrapolation is grounded in the measured first→last DNA trend.
  const report = await buildEvolutionReport(domain);

  if (report.points.length < 2) {
    return (
      <div className="glass rounded-xl p-8 text-center space-y-3">
        <h2 className="text-lg font-semibold">Not enough history to extrapolate</h2>
        <p className="text-sm text-mist">
          Future scenarios need at least two analyzed years of {domain}&apos;s real
          history to measure a trend from. Try again once more years load.
        </p>
        <Link href={`/entity/${domain}/evolution`} className="text-sm text-amber-bright hover:underline">
          View the evolution report →
        </Link>
      </div>
    );
  }

  const first = report.points[0];
  const last = report.points[report.points.length - 1];

  if (year === null || !TARGET_YEARS.includes(year as (typeof TARGET_YEARS)[number]) || !scenarioId || !getScenario(scenarioId)) {
    // Picker state.
    return (
      <form
        method="GET"
        action={`/entity/${domain}/future`}
        className="glass rounded-xl p-5 sm:p-6 space-y-5 animate-section"
      >
        <div className="space-y-2">
          <label htmlFor="future-year" className="text-sm font-medium text-fog">
            Target year
          </label>
          <select
            id="future-year"
            name="year"
            defaultValue={TARGET_YEARS[0]}
            className="w-full max-w-40 rounded-md border border-line bg-raised px-3 py-2 text-sm text-fog"
          >
            {TARGET_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-fog">Scenario</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {SCENARIOS.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer gap-3 glass rounded-lg p-4 card-hover has-checked:border-amber/60 has-checked:bg-amber/10"
              >
                <input
                  type="radio"
                  name="scenario"
                  value={s.id}
                  defaultChecked={s.id === "mainstream"}
                  className="mt-1 accent-amber"
                />
                <span>
                  <span className="block text-sm font-semibold text-fog">{s.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-mist">
                    {s.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="btn-primary px-5 py-2.5 text-sm animate-pulse-glow"
        >
          Extrapolate to the future
        </button>
      </form>
    );
  }

  const scenario = getScenario(scenarioId)!;
  const result = buildFutureScenario(scenarioId, year, {
    first: first.dna,
    last: last.dna,
    firstYear: Number(first.year),
    lastYear: Number(last.year),
  });

  const lastDna: DnaProfile = { ...last.dna };

  return (
    <div className="space-y-8">
      {/* speculation banner (plan §24: never present future output as fact) */}
      <div
        role="status"
        className="glass-strong rounded-xl border-amber/60 bg-amber/10 px-5 py-3.5 text-center animate-section"
      >
        <p className="text-sm font-bold tracking-[0.15em] text-amber-bright">
          HYPOTHETICAL — SPECULATION, NOT PREDICTION
        </p>
        <p className="mt-1 text-xs text-mist">
          This is one possible future for {domain} under the {scenario.label.toLowerCase()}{" "}
          scenario. Nobody — including us — knows what the web will look like in {year}.
        </p>
      </div>

      {/* facets from plan §24's example */}
      <section aria-labelledby="facets-heading">
        <p className="eyebrow">{year} — {scenario.label.toLowerCase()} scenario</p>
        <h2 id="facets-heading" className="text-xl sm:text-2xl font-bold tracking-tight mb-5">
          The shape of this future
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Navigation", result.facets.navigation],
              ["Content", result.facets.content],
              ["Interface", result.facets.interface],
              ["Search", result.facets.search],
            ] as Array<[string, string]>
          ).map(([label, value]) => (
            <div key={label} className="glass rounded-xl px-4 py-3.5 card-hover">
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">{label}</dt>
              <dd className="mt-1 text-sm font-medium text-fog">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-faint">
          <span className="font-semibold text-mist">HYPOTHESIS</span> — scenario
          philosophy, applied to a measured base. Not a forecast.
        </p>
      </section>

      {/* extrapolated DNA vs the latest real year */}
      <section aria-labelledby="future-dna-heading" className="glass rounded-xl p-5 sm:p-6">
        <p className="eyebrow">Extrapolated DNA</p>
        <h2 id="future-dna-heading" className="text-xl sm:text-2xl font-bold tracking-tight mb-5">
          Extrapolated Internet DNA
        </h2>
        <DnaBarsCompare
          dnaA={lastDna}
          dnaB={{ ...result.dna, algorithmVersion: result.futureVersion }}
          labelA={`${last.year} real (latest)`}
          labelB={`${year} hypothetical`}
        />
        <p className="mt-3 text-xs text-faint">
          <span className="font-semibold text-mist">FACT</span> — the {last.year}{" "}
          column is the latest measured profile (DNA v{last.dna.algorithmVersion}).{" "}
          <span className="font-semibold text-mist">HYPOTHESIS</span> — the {year}{" "}
          column extrapolates the measured {first.year}–{last.year} trend,
          modulated by the {scenario.label.toLowerCase()} scenario (Future v{result.futureVersion}).
        </p>
      </section>

      {/* grounding: what was actually measured */}
      <section aria-labelledby="grounding-heading" className="glass rounded-xl p-5 sm:p-6">
        <p className="eyebrow">Grounding</p>
        <h2 id="grounding-heading" className="text-xl sm:text-2xl font-bold tracking-tight mb-5">
          What the extrapolation is built on
        </h2>
        {result.trendGrounding.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {result.trendGrounding.map((g, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-0.5 shrink-0 rounded border border-azure/50 px-1.5 py-px text-[10px] font-semibold tracking-wide text-azure">
                  FACT
                </span>
                <span className="text-mist tabular-nums">{g}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-mist">
            The measured history is nearly flat — no dimension moved enough to
            establish a trend. The scenario below is philosophy applied to a
            static base.
          </p>
        )}
      </section>

      {/* assumptions (plan §49) */}
      <section aria-labelledby="assumptions-heading" className="glass rounded-xl p-5 sm:p-6">
        <p className="eyebrow">Assumptions</p>
        <h2 id="assumptions-heading" className="text-xl sm:text-2xl font-bold tracking-tight mb-5">
          If any of these is wrong, this future is wrong
        </h2>
        <ul className="space-y-2.5 text-sm text-mist leading-relaxed">
          {result.assumptions.map((a, i) => (
            <li key={i} className="flex gap-2.5">
              <span aria-hidden="true" className="text-faint">•</span>
              {a}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/entity/${domain}/future`}
          className="btn-ghost px-4 py-2.5 text-sm font-semibold"
        >
          Try another scenario
        </Link>
        <Link
          href={`/entity/${domain}/evolution`}
          className="btn-ghost px-4 py-2.5 text-sm font-semibold"
        >
          See the real history this is built on →
        </Link>
        <Link
          href={`/entity/${domain}/lab`}
          className="btn-ghost px-4 py-2.5 text-sm font-semibold"
        >
          Run a transformation instead ⚗
        </Link>
      </div>
    </div>
  );
}

function FutureSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="h-24 glass rounded-xl animate-pulse-soft" />
      <p className="text-center text-sm text-mist">
        Loading the site&apos;s measured history to extrapolate from…
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
    title: `Future scenarios — ${domain}`,
    description: `Hypothetical future scenarios for ${domain}, extrapolated from its measured history. Always labeled speculative.`,
    alternates: { canonical: `/entity/${domain}/future` },
  };
}

export default async function FuturePage({
  params,
  searchParams,
}: {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ year?: string; scenario?: string }>;
}) {
  const { domain: raw } = await params;
  const { year: yearParam, scenario } = await searchParams;
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

  const year = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : null;
  const scenarioId = (scenario ?? null) as ScenarioId | null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <header className="mb-8">
        <p className="eyebrow eyebrow-accent">Future Mode</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">
          Where might {domain} go next?
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Scenarios extrapolated from the site&apos;s measured {""}
          trajectory — grounded speculation, clearly labeled. Never predictions.
        </p>
        <Link href={`/entity/${domain}`} className="mt-2 inline-block text-sm text-mist hover:text-fog">
          ← Timeline
        </Link>
      </header>
      <Suspense fallback={<FutureSkeleton />}>
        <FutureBody domain={domain} year={year} scenarioId={scenarioId} />
      </Suspense>
    </div>
  );
}
