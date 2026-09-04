// Discovery page (plan §37): a public feed of what's been explored —
// most dramatic changes, oldest websites, most minimal sites, recent
// shares and experiments. Rankings use stored measurements, and the
// ranking signal is shown next to every item ("do not rank solely by
// raw activity; use transparent ranking signals").

import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatCaptureDate } from "@/lib/security/url";
import { getLabMode } from "@/lib/lab/engine";

export const dynamic = "force-dynamic";

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-6 text-sm text-mist">
      {text}
    </div>
  );
}

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Discover the most dramatic website changes, the oldest sites explored, recent comparisons and Evolution Lab experiments.",
  alternates: { canonical: "/explore" },
};

export default async function ExplorePage() {
  // Oldest websites explored — ranked by earliest capture (a FACT).
  const oldest = await prisma.entity.findMany({
    where: { firstCaptureAt: { not: null } },
    orderBy: { firstCaptureAt: "asc" },
    take: 8,
  });

  // Most minimal sites — highest DNA minimalism of their latest analysis.
  const minimal = await prisma.dna.findMany({
    orderBy: { minimalism: "desc" },
    take: 8,
    include: { analysis: { include: { snapshot: { include: { entity: true } } } } },
  });

  // Most dramatic detected changes — highest event magnitude (stored events).
  const dramatic = await prisma.timelineEvent.findMany({
    orderBy: { magnitude: "desc" },
    take: 8,
    include: { entity: true },
  });

  // Recent shared comparisons.
  const recentShares = await prisma.share.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  // Recent Evolution Lab experiments.
  const recentExperiments = await prisma.labExperiment.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const hasAny =
    oldest.length > 0 ||
    minimal.length > 0 ||
    dramatic.length > 0 ||
    recentShares.length > 0 ||
    recentExperiments.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-12">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-faint">Discovery</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">
          What the community has been exploring
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Everything below comes from real, stored measurements. Each list shows
          the exact signal it is ranked by — no opaque popularity scores.
        </p>
      </header>

      {!hasAny && (
        <Empty text="Nothing here yet — explore a website and it will appear in these lists once it's been analyzed." />
      )}

      {/* Most dramatic detected changes */}
      {dramatic.length > 0 && (
        <section aria-labelledby="dramatic-heading">
          <h2 id="dramatic-heading" className="text-lg font-semibold">
            Most dramatic detected changes
          </h2>
          <p className="mt-1 text-xs text-faint">
            Ranked by event magnitude (0–100) from deterministic year-over-year
            comparison. <span className="font-semibold text-mist">INFERENCE</span>{" "}
            — the threshold call is ours, the measurements are facts.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {dramatic.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/entity/${e.entity.domain}/compare?a=${e.snapshotA}&b=${e.snapshotB}`}
                  className="block rounded-xl border border-line bg-panel p-4 hover:border-amber/50 hover:bg-raised transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold truncate">{e.entity.domain}</span>
                    <span className="text-xs text-faint tabular-nums shrink-0">
                      {e.snapshotA.slice(0, 4)} → {e.snapshotB.slice(0, 4)}
                    </span>
                  </div>
                  <div className="mt-1.5 text-sm text-mist">
                    {e.type} change · {e.confidence} confidence
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="meter-track h-1.5 w-24 rounded-full">
                      <div className="h-1.5 rounded-full bg-amber" style={{ width: `${e.magnitude}%` }} />
                    </div>
                    <span className="text-xs text-faint tabular-nums">magnitude {e.magnitude}/100</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Oldest websites explored */}
      {oldest.length > 0 && (
        <section aria-labelledby="oldest-heading">
          <h2 id="oldest-heading" className="text-lg font-semibold">
            Oldest websites explored
          </h2>
          <p className="mt-1 text-xs text-faint">
            Ranked by earliest archived capture date. <span className="font-semibold text-mist">FACT</span>{" "}
            — straight from archive metadata.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {oldest.map((entity) => (
              <li key={entity.id}>
                <Link
                  href={`/entity/${entity.domain}`}
                  className="block rounded-xl border border-line bg-panel p-4 hover:border-amber/50 hover:bg-raised transition-colors"
                >
                  <div className="font-semibold truncate">{entity.domain}</div>
                  <div className="mt-1 text-sm text-amber-bright tabular-nums">
                    since {formatCaptureDate(entity.firstCaptureAt!)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Most minimal sites */}
      {minimal.length > 0 && (
        <section aria-labelledby="minimal-heading">
          <h2 id="minimal-heading" className="text-lg font-semibold">
            Most minimal sites
          </h2>
          <p className="mt-1 text-xs text-faint">
            Ranked by DNA minimalism score (0–100) of an analyzed snapshot.{" "}
            <span className="font-semibold text-mist">INFERENCE</span> — a
            heuristic score, deterministic and versioned (DNA v1.0).
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {minimal.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/entity/${d.analysis.snapshot.entity.domain}/snapshot/${d.analysis.snapshot.timestamp}`}
                  className="block rounded-xl border border-line bg-panel p-4 hover:border-amber/50 hover:bg-raised transition-colors"
                >
                  <div className="font-semibold truncate">
                    {d.analysis.snapshot.entity.domain}
                  </div>
                  <div className="mt-1 text-sm text-mist">
                    {d.analysis.snapshot.timestamp.slice(0, 4)} snapshot
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="meter-track h-1.5 w-24 rounded-full">
                      <div className="h-1.5 rounded-full bg-amber" style={{ width: `${d.minimalism}%` }} />
                    </div>
                    <span className="text-xs text-faint tabular-nums">minimalism {d.minimalism}/100</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent shares + experiments */}
      <div className="grid gap-12 lg:grid-cols-2">
        {recentShares.length > 0 && (
          <section aria-labelledby="shares-heading">
            <h2 id="shares-heading" className="text-lg font-semibold">
              Recently shared comparisons
            </h2>
            <p className="mt-1 text-xs text-faint">Newest first — creation order, nothing else.</p>
            <ul className="mt-4 space-y-3">
              {recentShares.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/share/${s.slug}`}
                    className="block rounded-xl border border-line bg-panel p-4 hover:border-amber/50 hover:bg-raised transition-colors"
                  >
                    <div className="font-semibold">
                      {s.domain} · {s.timestampA.slice(0, 4)} vs {s.timestampB.slice(0, 4)}
                    </div>
                    <div className="mt-1 text-xs text-faint truncate">/share/{s.slug}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {recentExperiments.length > 0 && (
          <section aria-labelledby="experiments-heading">
            <h2 id="experiments-heading" className="text-lg font-semibold">
              Recent Evolution Lab experiments
            </h2>
            <p className="mt-1 text-xs text-faint">
              Newest first. All experiments are{" "}
              <span className="font-semibold text-mist">HYPOTHETICAL</span> —
              deterministic transformations, never historical.
            </p>
            <ul className="mt-4 space-y-3">
              {recentExperiments.map((x) => (
                <li key={x.id}>
                  <Link
                    href={`/share/lab/${x.domain}/${x.timestamp}/${x.mode}`}
                    className="block rounded-xl border border-line bg-panel p-4 hover:border-amber/50 hover:bg-raised transition-colors"
                  >
                    <div className="font-semibold">
                      {x.domain} · {getLabMode(x.mode)?.label ?? x.mode}
                    </div>
                    <div className="mt-1 text-xs text-faint">
                      from the {x.timestamp.slice(0, 4)} snapshot ·{" "}
                      <span className="text-amber-bright/80">HYPOTHETICAL</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <footer className="text-xs text-faint leading-relaxed">
        These lists refresh as people explore. Rankings never use likes or raw
        traffic — only measurable signals from stored analyses, with the signal
        named beside each list.{" "}
        <Link href="/about" className="text-mist underline hover:text-fog">
          Methodology
        </Link>
        .
      </footer>
    </div>
  );
}
