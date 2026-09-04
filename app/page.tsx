import Link from "next/link";
import type { Metadata } from "next";
import { SearchBar } from "@/components/SearchBar";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const EXAMPLES = ["google.com", "youtube.com", "apple.com", "wikipedia.org", "amazon.com"];

const ACTIONS = [
  {
    title: "Explore History",
    description:
      "Pick a website, pick a year, and see the real archived page — from the 1990s to today.",
    href: `/entity/google.com`,
    cta: "See Google through time",
  },
  {
    title: "Compare Websites",
    description:
      "Put two eras side by side, wipe between them with a slider, and get a shareable link.",
    href: `/entity/youtube.com/compare`,
    cta: "Compare YouTube eras",
  },
  {
    title: "View Internet DNA",
    description:
      "Measure minimalism, information density, commercialization, mobile focus and more — deterministically.",
    href: `/entity/apple.com`,
    cta: "See Apple through time",
  },
  {
    title: "Explore Discoveries",
    description:
      "The most dramatic website changes, oldest sites explored, and community experiments — ranked by transparent signals.",
    href: `/explore`,
    cta: "Browse the discovery feed",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero (plan §7) */}
      <section className="relative border-b border-line">
        <div aria-hidden="true" className="absolute inset-0 bg-grid bg-grid-fade" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-20 text-center">
          <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.25em] text-amber-bright">
            Street View for the Internet
          </p>
          <h1 className="animate-fade-up mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Travel through the history of the Internet.
          </h1>
          <p className="animate-fade-up mx-auto mt-5 max-w-xl text-base sm:text-lg text-mist">
            Search any website, choose a moment in time, and explore how its
            design, content, technology and behavior evolved — year by year.
          </p>

          <div className="animate-fade-up mt-9">
            <SearchBar />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-faint">Try:</span>
            {EXAMPLES.map((ex) => (
              <Link
                key={ex}
                href={`/entity/${ex}`}
                className="rounded-full border border-line bg-panel px-3 py-1 text-mist hover:text-fog hover:border-faint transition-colors"
              >
                {ex}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — the architectural principle (plan §0) */}
      <section aria-labelledby="how-heading" className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <h2 id="how-heading" className="text-2xl font-bold tracking-tight">
          Archive → Analyze → Visualize → Evolve
        </h2>
        <p className="mt-2 max-w-2xl text-mist">
          Real snapshots are the raw material. The product is the understanding
          of change — measured deterministically, never guessed, and never
          dependent on paid AI.
        </p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "01",
              title: "Archive",
              text: "Public web archives hold decades of captures. We fetch only what you ask for.",
            },
            {
              step: "02",
              title: "Analyze",
              text: "Deterministic HTML analysis counts words, links, images, structure and technology signals.",
            },
            {
              step: "03",
              title: "Visualize",
              text: "Timelines, side-by-side comparisons, sliders and change meters make evolution visible.",
            },
            {
              step: "04",
              title: "Evolve",
              text: "Internet DNA profiles quantify each era. Deeper evolution tools grow from this evidence.",
            },
          ].map((s) => (
            <li key={s.step} className="rounded-xl border border-line bg-panel p-5">
              <div className="text-xs font-semibold tabular-nums text-amber-bright">{s.step}</div>
              <h3 className="mt-2 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-mist">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Main actions (plan §7) */}
      <section id="explore" aria-labelledby="actions-heading" className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <h2 id="actions-heading" className="text-2xl font-bold tracking-tight">
          What would you like to explore?
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {ACTIONS.map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className="group rounded-xl border border-line bg-panel p-6 hover:border-amber/50 hover:bg-raised transition-colors"
            >
              <h3 className="font-semibold text-lg group-hover:text-amber-bright transition-colors">
                {a.title}
              </h3>
              <p className="mt-2 text-sm text-mist">{a.description}</p>
              <span className="mt-4 inline-block text-sm text-amber-bright">{a.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Honesty note (plan §77: curious, historical, scientific, honest) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="rounded-xl border border-line bg-panel p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Facts, inferences, and hypotheses — never mixed</h2>
          <p className="mt-2 max-w-3xl text-sm text-mist">
            Every statement in Internet Time Machine carries an explicit status.
            <strong className="text-fog"> Facts</strong> come directly from
            archived data. <strong className="text-fog">Inferences</strong> are
            interpretations derived from evidence. Future features will label
            hypothetical content clearly as such — speculation is never
            presented as history.
          </p>
        </div>
      </section>
    </div>
  );
}
