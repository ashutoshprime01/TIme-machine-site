// Evolution Lab (plan §20–21, §48): pick a real snapshot and a transformation
// mode, get a deterministic hypothetical result. Everything on this page is
// labeled HYPOTHETICAL — NOT HISTORICAL (plan §2: never mix fact with
// speculation). No AI: transformations are rules applied to measured values.

import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { archive } from "@/lib/archive";
import { analyzeCapture } from "@/lib/analysis/service";
import { applyTransformation, LAB_MODES, getLabMode, type LabResult } from "@/lib/lab/engine";
import { validateDomain, formatCaptureDate } from "@/lib/security/url";
import { prisma } from "@/lib/db";
import { DnaBarsCompare } from "@/components/dna/DnaBars";
import { LabShareButton } from "@/components/lab/LabShareButton";
import type { Capture } from "@/lib/types";

async function LabBody({
  domain,
  timestamp,
  modeId,
}: {
  domain: string;
  timestamp: string | null;
  modeId: string | null;
}) {
  const captures = await archive.searchCaptures(domain);

  if (captures.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-panel p-8 text-center space-y-3">
        <h2 className="text-lg font-semibold">Nothing to experiment with yet</h2>
        <p className="text-sm text-mist">
          We couldn&apos;t find archived captures for {domain}, so there&apos;s no
          starting point for a transformation.
        </p>
        <Link href="/" className="text-sm text-amber-bright hover:underline">
          Search another website →
        </Link>
      </div>
    );
  }

  // Group captures by year for the selector (most recent year first).
  const byYear = new Map<string, Capture[]>();
  for (const c of captures) {
    const y = c.timestamp.slice(0, 4);
    (byYear.get(y) ?? byYear.set(y, []).get(y)!).push(c);
  }
  const yearGroups = [...byYear.entries()].sort(([a], [b]) => b.localeCompare(a));

  // Default starting point: the oldest capture (the "before").
  const source =
    timestamp && captures.some((c) => c.timestamp === timestamp)
      ? timestamp
      : captures[0].timestamp;

  if (!modeId || !getLabMode(modeId)) {
    // No experiment selected yet: show the picker.
    return (
      <div className="space-y-8">
        <form
          method="GET"
          action={`/entity/${domain}/lab`}
          className="rounded-xl border border-line bg-panel p-5 sm:p-6 space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="lab-timestamp" className="text-sm font-medium text-fog">
                Starting version (real snapshot)
              </label>
              <select
                id="lab-timestamp"
                name="t"
                defaultValue={source}
                className="w-full rounded-md border border-line bg-raised px-3 py-2 text-sm text-fog"
              >
                {yearGroups.map(([y, list]) => (
                  <optgroup key={y} label={y}>
                    {list.map((c) => (
                      <option key={c.timestamp} value={c.timestamp}>
                        {formatCaptureDate(c.timestamp)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-fog">Transformation</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {LAB_MODES.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer gap-3 rounded-lg border border-line bg-raised p-4 hover:border-amber/50 transition-colors has-checked:border-amber has-checked:bg-amber/10"
                >
                  <input
                    type="radio"
                    name="mode"
                    value={m.id}
                    defaultChecked={m.id === "modernize"}
                    className="mt-1 accent-amber"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-fog">{m.label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-mist">
                      {m.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            className="rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-ink hover:bg-amber-bright transition-colors"
          >
            Run the transformation
          </button>
        </form>

        <p className="text-xs text-faint leading-relaxed">
          Experiments are deterministic transformations of the measured snapshot —
          the same source and mode always produce the same result (Lab v1.0).
          No AI is involved. Every result is clearly marked as hypothetical.
        </p>
      </div>
    );
  }

  // Run the experiment (cached/persisted analysis of the source snapshot).
  let analysis;
  try {
    analysis = await analyzeCapture(domain, source);
  } catch {
    return (
      <div className="rounded-xl border border-line bg-panel p-8 text-center space-y-3">
        <h2 className="text-lg font-semibold">We couldn&apos;t analyze the starting snapshot</h2>
        <p className="text-sm text-mist">
          The archive didn&apos;t respond in time. Please try again in a moment.
        </p>
        <Link href={`/entity/${domain}/lab`} className="text-sm text-amber-bright hover:underline">
          ← Back to the Lab
        </Link>
      </div>
    );
  }

  const mode = getLabMode(modeId)!;
  const result = applyTransformation(mode.id, analysis.analysis.metrics, analysis.analysis.dna);
  const sourceYear = source.slice(0, 4);

  // Persist the experiment so shared URLs can re-render it (plan §48
  // experiment storage). Deterministic: same inputs → same stored result.
  try {
    await prisma.labExperiment.upsert({
      where: { slug: experimentSlug(domain, source, mode.id) },
      create: {
        slug: experimentSlug(domain, source, mode.id),
        domain,
        timestamp: source,
        mode: mode.id,
        result: JSON.stringify(result),
        isHypothetical: true,
      },
      update: { result: JSON.stringify(result) },
    });
  } catch {
    // Storage is best-effort; the page renders from the live computation.
  }

  return (
    <div className="space-y-8">
      {/* the one label the plan insists on (§20) */}
      <div
        role="status"
        className="rounded-xl border border-amber/60 bg-amber/15 px-5 py-3.5 text-center"
      >
        <p className="text-sm font-bold tracking-[0.15em] text-amber-bright">
          HYPOTHETICAL — NOT HISTORICAL
        </p>
        <p className="mt-1 text-xs text-mist">
          What follows is a deterministic thought experiment built from real
          measurements. {domain} never actually looked like this.
        </p>
      </div>

      {/* SOURCE → TRANSFORMATION → RESULT (plan §20) */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Source", value: `${sourceYear} real snapshot`, href: `/entity/${domain}/snapshot/${source}` },
          { label: "Transformation", value: mode.label },
          { label: "Result", value: `Hypothetical version` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-panel px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-faint">{s.label}</p>
            <p className="mt-1 text-sm font-semibold text-fog">
              {s.href ? (
                <Link href={s.href} className="hover:text-amber-bright hover:underline">
                  {s.value} ↗
                </Link>
              ) : (
                s.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* hypothetical DNA vs the real source (labels say which is real) */}
      <section aria-labelledby="lab-dna-heading" className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h2 id="lab-dna-heading" className="text-lg font-semibold mb-4">
          Hypothetical Internet DNA
        </h2>
        <DnaBarsCompare
          dnaA={analysis.analysis.dna}
          dnaB={{ ...result.dna, algorithmVersion: result.dna.algorithmVersion }}
          labelA={`${sourceYear} real`}
          labelB="hypothetical"
        />
        <p className="mt-3 text-xs text-faint">
          <span className="font-semibold text-mist">FACT</span> — the {sourceYear}{" "}
          column is measured (Analysis v{analysis.analysis.algorithmVersion}, DNA
          v{analysis.analysis.dna.algorithmVersion}).{" "}
          <span className="font-semibold text-mist">HYPOTHESIS</span> — the
          hypothetical column is where the dimensions would sit under this
          transformation (Lab v{result.labVersion}).
        </p>
      </section>

      {/* transformations */}
      <section aria-labelledby="lab-changes-heading" className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h2 id="lab-changes-heading" className="text-lg font-semibold mb-4">
          What the transformation does
        </h2>
        <ul className="space-y-3">
          {result.transformations.map((t, i) => (
            <li key={i} className="flex gap-2.5 text-sm">
              <span className="mt-0.5 shrink-0 rounded border border-amber/50 px-1.5 py-px text-[10px] font-semibold tracking-wide text-amber-bright">
                {t.status}
              </span>
              <span className="text-mist leading-relaxed">{t.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* recommendations */}
      <section aria-labelledby="lab-recs-heading" className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h2 id="lab-recs-heading" className="text-lg font-semibold mb-4">
          Considerations
        </h2>
        <ul className="space-y-2.5 text-sm text-mist leading-relaxed">
          {result.recommendations.map((r, i) => (
            <li key={i} className="flex gap-2.5">
              <span aria-hidden="true" className="text-faint">•</span>
              {r}
            </li>
          ))}
        </ul>
      </section>

      {/* actions */}
      <div className="flex flex-wrap items-center gap-3">
        <LabShareButton domain={domain} timestamp={source} mode={mode.id} />
        <Link
          href={`/entity/${domain}/lab?t=${source}`}
          className="rounded-lg border border-line px-4 py-2 text-sm text-mist hover:text-fog hover:border-amber/50 transition-colors"
        >
          Try another transformation
        </Link>
        <Link
          href={`/entity/${domain}/compare?a=${source}&b=${captures[captures.length - 1].timestamp}`}
          className="rounded-lg border border-line px-4 py-2 text-sm text-mist hover:text-fog hover:border-amber/50 transition-colors"
        >
          Compare with what really happened →
        </Link>
      </div>
    </div>
  );
}

/** Deterministic slug: same experiment → same URL (dedupes storage). */
function experimentSlug(domain: string, timestamp: string, mode: string): string {
  return `${domain}-${timestamp}-${mode}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

function LabSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="h-24 rounded-xl border border-line bg-panel animate-pulse-soft" />
      <p className="text-center text-sm text-mist">Preparing the Lab…</p>
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
    title: `Evolution Lab — ${domain}`,
    description: `Run deterministic hypothetical transformations on ${domain}'s archived versions. Always labeled hypothetical.`,
    alternates: { canonical: `/entity/${domain}/lab` },
  };
}

export default async function LabPage({
  params,
  searchParams,
}: {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ t?: string; mode?: string }>;
}) {
  const { domain: raw } = await params;
  const { t, mode } = await searchParams;
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

  const timestamp = t && /^\d{14}$/.test(t) ? t : null;
  const modeId = mode ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-faint">Evolution Lab</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">
          What if {domain} had evolved differently?
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Pick a real archived version and a transformation. The Lab derives a
          hypothetical version from measured facts — deterministically, without AI.
        </p>
        <Link href={`/entity/${domain}`} className="mt-2 inline-block text-sm text-mist hover:text-fog">
          ← Timeline
        </Link>
      </header>
      <Suspense fallback={<LabSkeleton />}>
        <LabBody domain={domain} timestamp={timestamp} modeId={modeId} />
      </Suspense>
    </div>
  );
}
