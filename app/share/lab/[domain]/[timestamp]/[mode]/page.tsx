// Shared Evolution Lab experiment (plan §48 sharing). The URL carries the
// domain, source timestamp and mode — the deterministic transformation is
// re-run on load, so a shared link always shows the same result (Lab v1.0).

import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { archive } from "@/lib/archive";
import { analyzeCapture } from "@/lib/analysis/service";
import { applyTransformation, getLabMode } from "@/lib/lab/engine";
import { validateDomain } from "@/lib/security/url";
import type { DnaDimensions } from "@/lib/types";

async function LabSharedBody({
  domain,
  timestamp,
  modeId,
}: {
  domain: string;
  timestamp: string;
  modeId: string;
}) {
  const mode = getLabMode(modeId);
  if (!mode) {
    return (
      <div className="rounded-xl border border-line bg-panel p-8 text-center">
        <p className="text-sm text-mist">This experiment link is invalid.</p>
      </div>
    );
  }

  const captures = await archive.searchCaptures(domain);
  const source =
    captures.find((c) => c.timestamp === timestamp) ??
    (captures.length > 0 ? archive.nearestCapture(captures, timestamp) : null);
  if (!source) {
    return (
      <div className="rounded-xl border border-line bg-panel p-8 text-center">
        <p className="text-sm text-mist">
          The source snapshot for this experiment is no longer in the archive.
        </p>
      </div>
    );
  }

  let analysis;
  try {
    analysis = await analyzeCapture(domain, source.timestamp);
  } catch {
    return (
      <div className="rounded-xl border border-line bg-panel p-8 text-center">
        <p className="text-sm text-mist">
          We couldn&apos;t retrieve the source snapshot. Please try again in a moment.
        </p>
      </div>
    );
  }

  const result = applyTransformation(mode.id, analysis.analysis.metrics, analysis.analysis.dna);
  const sourceYear = source.timestamp.slice(0, 4);

  return (
    <div className="space-y-8">
      <div
        role="status"
        className="rounded-xl border border-amber/60 bg-amber/15 px-5 py-3.5 text-center"
      >
        <p className="text-sm font-bold tracking-[0.15em] text-amber-bright">
          HYPOTHETICAL — NOT HISTORICAL
        </p>
        <p className="mt-1 text-xs text-mist">
          Shared thought experiment: {mode.label} applied to {domain}&apos;s real{" "}
          {sourceYear} snapshot.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Source", value: `${sourceYear} real snapshot`, href: `/entity/${domain}/snapshot/${source.timestamp}` },
          { label: "Transformation", value: mode.label },
          { label: "Result", value: "Hypothetical version" },
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

      <section aria-labelledby="shared-dna-heading" className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h2 id="shared-dna-heading" className="text-lg font-semibold mb-4">
          Hypothetical Internet DNA
        </h2>
        <div className="space-y-2.5">
          {result.transformations.map((t, i) => (
            <div key={i} className="flex gap-2.5 text-sm">
              <span className="mt-0.5 shrink-0 rounded border border-amber/50 px-1.5 py-px text-[10px] font-semibold tracking-wide text-amber-bright">
                {t.status}
              </span>
              <span className="text-mist leading-relaxed">{t.text}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-faint">
          DNA deltas:{" "}
          {(Object.keys(result.dna) as Array<keyof DnaDimensions>)
            .filter((k) => k in analysis.analysis.dna)
            .map((k) => {
              const delta = result.dna[k] - analysis.analysis.dna[k];
              return delta === 0 ? null : `${k} ${delta > 0 ? "+" : ""}${delta}`;
            })
            .filter(Boolean)
            .join(" · ") || "minimal movement"}
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/entity/${domain}/lab?t=${source.timestamp}`}
          className="rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-ink hover:bg-amber-bright transition-colors"
        >
          Open in the Evolution Lab
        </Link>
        <Link
          href={`/entity/${domain}`}
          className="rounded-lg border border-line px-4 py-2.5 text-sm text-mist hover:text-fog hover:border-amber/50 transition-colors"
        >
          Explore {domain}&apos;s real timeline
        </Link>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; timestamp: string; mode: string }>;
}): Promise<Metadata> {
  const { domain: raw, timestamp, mode } = await params;
  const domain = decodeURIComponent(raw).toLowerCase();
  const labMode = getLabMode(mode);
  const year = timestamp.slice(0, 4);
  return {
    title: `Hypothetical: ${domain} ${labMode?.label ?? "experiment"} (${year}+) — Internet Time Machine`,
    description: `A shared Evolution Lab experiment: ${labMode?.label ?? "transformation"} applied to ${domain}'s ${year} snapshot. Hypothetical, not historical.`,
  };
}

export default async function SharedLabPage({
  params,
}: {
  params: Promise<{ domain: string; timestamp: string; mode: string }>;
}) {
  const { domain: raw, timestamp, mode } = await params;
  const domain = decodeURIComponent(raw).toLowerCase();
  const validation = validateDomain(domain);

  if (!validation.ok || !/^\d{14}$/.test(timestamp)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Invalid experiment link</h1>
        <Link href="/" className="mt-6 inline-block text-sm text-amber-bright hover:underline">
          Back to the Time Machine
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-faint">Shared experiment</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
          {domain} — alternate possibility
        </h1>
      </header>
      <Suspense
        fallback={
          <div className="h-24 rounded-xl border border-line bg-panel animate-pulse-soft" role="status" />
        }
      >
        <LabSharedBody domain={domain} timestamp={timestamp} modeId={mode} />
      </Suspense>
    </div>
  );
}
