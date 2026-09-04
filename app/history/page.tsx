// History of the Internet (plan §25): a visual, curated timeline of the
// web's eras — with a bridge into the Time Machine at every stop (explore a
// real site from that period). Below it, plan §26's technology-evolution
// view: what our own analyses have actually measured, era by era (FACT),
// separate from the curated public record.

import Link from "next/link";
import type { Metadata } from "next";
import { INTERNET_HISTORY, CATEGORY_LABELS, HISTORY_VERSION, type HistoryEvent } from "@/lib/history/data";
import { prisma } from "@/lib/db";
import type { TechSignal } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "History of the Internet",
  description:
    "A visual timeline of the web's eras — from the first website at CERN to the AI-native web — with links into real archived sites for every period.",
  alternates: { canonical: "/history" },
};

/** Aggregate measured tech signals by technology across analyzed snapshots. */
async function measuredTechnologies(): Promise<
  Array<{
    name: string;
    category: string;
    years: string[];
    snapshots: number;
    confidence: "high" | "medium" | "low";
  }>
> {
  const analyses = await prisma.analysis.findMany({
    select: { techSignals: true, snapshot: { select: { timestamp: true, entity: { select: { domain: true } } } } },
    take: 500,
  });

  const byTech = new Map<
    string,
    { category: string; years: Set<string>; snapshots: number; best: "high" | "medium" | "low" }
  >();
  for (const a of analyses) {
    let signals: TechSignal[] = [];
    try {
      signals = JSON.parse(a.techSignals) as TechSignal[];
    } catch {
      continue;
    }
    for (const s of signals) {
      const entry =
        byTech.get(s.name) ??
        { category: s.category, years: new Set<string>(), snapshots: 0, best: "low" as const };
      entry.years.add(a.snapshot.timestamp.slice(0, 4));
      entry.snapshots += 1;
      const rank = { low: 0, medium: 1, high: 2 } as const;
      if (rank[s.confidence] > rank[entry.best]) entry.best = s.confidence;
      byTech.set(s.name, entry);
    }
  }

  return [...byTech.entries()]
    .map(([name, e]) => ({
      name,
      category: e.category,
      years: [...e.years].sort(),
      snapshots: e.snapshots,
      confidence: e.best,
    }))
    .sort((a, b) => b.snapshots - a.snapshots || a.name.localeCompare(b.name));
}

function EventCard({ event }: { event: HistoryEvent }) {
  return (
    <li className="relative pl-10 sm:pl-14 pb-10 last:pb-0">
      {/* rail dot */}
      <span
        aria-hidden="true"
        className="absolute left-2 sm:left-3 top-1.5 w-3 h-3 rounded-full bg-amber ring-4 ring-ink"
      />
      <div className="glass rounded-xl p-5 card-hover">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-lg font-bold tabular-nums text-amber-bright">{event.year}</span>
          <span className="chip-poly">
            {CATEGORY_LABELS[event.category]}
          </span>
        </div>
        <h3 className="mt-1.5 text-lg font-semibold">{event.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-mist">{event.description}</p>
        {event.explore && (
          <div className="mt-4 flex flex-wrap gap-2.5">
            {event.explore.map((e) => (
              <Link
                key={e.domain}
                href={`/entity/${e.domain}`}
                title={e.note}
                className="chip-poly !text-sm !normal-case !tracking-normal"
              >
                Travel to {e.domain} <span aria-hidden="true">⇗</span>
                <span className="sr-only"> — {e.note}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

export default async function HistoryPage() {
  const technologies = await measuredTechnologies();
  const totalSnapshots = technologies.reduce((sum, t) => Math.max(sum, t.snapshots), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-14">
      <header>
        <p className="eyebrow eyebrow-accent">Global history</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">
          History of the Internet
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          The eras every website lived through. Each stop links to a real site
          you can travel through in the Time Machine — the public record below,
          your own measurements above it.
        </p>
      </header>

      {/* era timeline */}
      {INTERNET_HISTORY.map((era) => (
        <section key={era.range} aria-labelledby={`era-${era.range.replace(/[^\d]/g, "")}`}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 id={`era-${era.range.replace(/[^\d]/g, "")}`} className="text-2xl font-bold tracking-tight">
              {era.range}
            </h2>
            <span className="text-lg font-semibold text-amber-bright">{era.title}</span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-mist">{era.summary}</p>
          <ol className="relative mt-6 before:absolute before:left-[11px] sm:before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-line">
            {era.events.map((event) => (
              <EventCard key={`${event.sortYear}-${event.title}`} event={event} />
            ))}
          </ol>
        </section>
      ))}

      {/* measured technologies (plan §26) */}
      <section aria-labelledby="measured-heading">
        <h2 id="measured-heading" className="text-2xl font-bold tracking-tight">
          What the Time Machine has measured
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Unlike the timeline above, this section is built from our own stored
          analyses: the technology signals detected in snapshots users have
          explored. It grows as more sites are examined.
        </p>

        {technologies.length === 0 ? (
          <div className="mt-4 glass rounded-xl p-6 text-sm text-mist">
            Nothing measured yet — explore a website ({" "}
            <Link href="/entity/info.cern.ch" className="text-amber-bright hover:underline">
              try the first website
            </Link>{" "}
            ) and its detected technologies will appear here.
          </div>
        ) : (
          <div className="mt-4 glass rounded-xl p-5">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="text-xs text-faint">
                  <th scope="col" className="py-2 pr-4 font-medium">Technology</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Category</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Years observed</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Snapshots</th>
                  <th scope="col" className="py-2 font-medium">Best confidence</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {technologies.map((t) => (
                  <tr key={t.name} className="border-t border-line-soft">
                    <td className="py-2 pr-4 text-fog">{t.name}</td>
                    <td className="py-2 pr-4 text-mist">{t.category}</td>
                    <td className="py-2 pr-4 text-mist">
                      {t.years.length > 6
                        ? `${t.years[0]}–${t.years[t.years.length - 1]}`
                        : t.years.join(", ")}
                    </td>
                    <td className="py-2 pr-4 text-fog">{t.snapshots}</td>
                    <td className="py-2">
                      <span
                        className={`rounded border px-1.5 py-px text-[10px] font-semibold tracking-wide ${
                          t.confidence === "high"
                            ? "border-azure/50 text-azure"
                            : "border-line text-faint"
                        }`}
                      >
                        {t.confidence.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-faint">
              <span className="font-semibold text-mist">FACT</span> — detections
              stored by Analysis v1.0 across up to {totalSnapshots} analyzed
              snapshots. Confidence reflects the evidence class (e.g. a direct
              script reference is high; a filename hint is low). Never treated
              as certainty when evidence is incomplete.
            </p>
          </div>
        )}
      </section>

      <footer className="glass rounded-xl p-5 text-xs leading-relaxed text-faint">
        <p>
          The curated timeline is the public historical record (dataset v
          {HISTORY_VERSION}) — dates and events as widely documented by their
          principals (CERN, W3C) and the Internet Archive. It is editorial
          content, not our analysis. The measured section is generated from
          this app&apos;s own deterministic analyses.{" "}
          <Link href="/about" className="text-mist underline hover:text-fog">
            Read the full methodology
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
