import Link from "next/link";
import type { Metadata } from "next";
import { SearchBar } from "@/components/SearchBar";
import { Marquee } from "@/components/ui/Marquee";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const EXAMPLES = ["google.com", "youtube.com", "apple.com", "wikipedia.org", "amazon.com"];

const ARSENAL = [
  "Wayback CDX", "Deterministic Analysis", "Internet DNA", "Evolution Engine",
  "Change Detection", "Tech Fingerprinting", "Evolution Lab", "Future Simulator",
  "Sandboxed Viewer", "Content-Hash Caching", "FACT / INFERENCE", "Zero Paid APIs",
];

const ACTIONS = [
  {
    num: "01",
    title: "Explore History",
    description:
      "Pick a website, pick a year, and see the real archived page — from the 1990s to today.",
    href: `/entity/google.com`,
    cta: "See Google through time",
  },
  {
    num: "02",
    title: "Compare Eras",
    description:
      "Put two eras side by side, wipe between them with a slider, and get a shareable link.",
    href: `/entity/youtube.com/compare`,
    cta: "Compare YouTube eras",
  },
  {
    num: "03",
    title: "Measure Evolution",
    description:
      "Internet DNA, detected change events, cross-year charts — every claim deterministic and labeled.",
    href: `/entity/apple.com/evolution`,
    cta: "Run an evolution report",
  },
  {
    num: "04",
    title: "Hypothesize",
    description:
      "Run deterministic what-if transformations in the Evolution Lab, or extrapolate measured trends to 2040.",
    href: `/entity/wikipedia.org/lab`,
    cta: "Open the Evolution Lab",
  },
];

const STEPS = [
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
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-balance">
        {title}
      </h2>
      {description && <p className="mt-3 text-mist">{description}</p>}
    </div>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* Hero (plan §7) */}
      <section className="relative border-b border-white/5 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 bg-grid bg-grid-fade" />
        <div aria-hidden="true" className="absolute inset-0 ambient-wash" />
        <div
          aria-hidden="true"
          className="orb w-[480px] h-[480px] bg-amber/20 -top-40 -left-32 animate-float"
        />
        <div
          aria-hidden="true"
          className="orb w-[420px] h-[420px] bg-azure/15 top-24 -right-32"
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-24 pb-20 sm:pt-36 sm:pb-28 text-center">
          <p className="animate-fade-up eyebrow eyebrow-accent">
            Street View for the Internet
          </p>
          <h1 className="animate-fade-up mx-auto mt-6 max-w-4xl text-5xl sm:text-6xl lg:text-8xl font-extrabold tracking-tight leading-[0.95] text-balance">
            Travel through
            <br />
            <span className="font-light italic font-serif text-fog/90">
              the history of
            </span>{" "}
            <span className="text-shimmer">the Internet.</span>
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-xl text-base sm:text-lg text-mist">
            Search any website, choose a moment in time, and explore how its
            design, content, technology and behavior evolved — year by year.
          </p>

          <div className="animate-fade-up mt-10">
            <SearchBar />
          </div>

          <div className="animate-fade-up mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-faint">Try</span>
            {EXAMPLES.map((ex) => (
              <Link
                key={ex}
                href={`/entity/${ex}`}
                className="chip-poly"
              >
                {ex}
              </Link>
            ))}
          </div>

          {/* scroll cue */}
          <div
            aria-hidden="true"
            className="mt-16 mx-auto w-px h-10 bg-gradient-to-b from-white/40 to-transparent"
          />
          <p className="sr-only">Scroll to explore</p>
        </div>
      </section>

      {/* Technical arsenal marquee (decorative ticker) */}
      <div className="border-b border-white/5 py-5 text-mist/50">
        <Marquee items={ARSENAL} />
      </div>

      {/* How it works — the architectural principle (plan §0) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <SectionHeading
          eyebrow="01 — The Principle"
          title={
            <>
              Archive <span className="text-amber-bright">→</span> Analyze{" "}
              <span className="text-amber-bright">→</span> Visualize{" "}
              <span className="text-amber-bright">→</span> Evolve
            </>
          }
          description="Real snapshots are the raw material. The product is the understanding of change — measured deterministically, never guessed, and never dependent on paid AI."
        />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger">
          {STEPS.map((s) => (
            <li key={s.step} className="glass rounded-xl p-5 card-hover">
              <div className="font-mono text-xs font-semibold tabular-nums text-amber-bright tracking-[0.2em]">
                {s.step}
              </div>
              <h3 className="mt-3 font-semibold text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-mist leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="hairline" /></div>

      {/* Main actions (plan §7) */}
      <section id="explore" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <SectionHeading
          eyebrow="02 — Destinations"
          title="What would you like to explore?"
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {ACTIONS.map((a) => (
            <Link
              key={a.num}
              href={a.href}
              className="group glass rounded-xl p-6 sm:p-7 card-hover"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-xs tabular-nums text-faint tracking-[0.2em]">
                  {a.num}
                </span>
                <span
                  aria-hidden="true"
                  className="w-px h-8 bg-gradient-to-b from-white/40 group-hover:from-amber-bright to-transparent transition-colors"
                />
              </div>
              <h3 className="mt-4 font-semibold text-xl group-hover:text-amber-bright transition-colors">
                {a.title}
              </h3>
              <p className="mt-2 text-sm text-mist leading-relaxed">{a.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-amber-bright">
                {a.cta}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="hairline" /></div>

      {/* Honesty note (plan §77) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="glass rounded-2xl p-6 sm:p-10 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="orb w-72 h-72 bg-azure/10 -top-24 -right-24"
          />
          <div className="relative">
            <SectionHeading
              eyebrow="03 — The Honesty Rule"
              title={
                <>
                  Facts, inferences, and hypotheses —{" "}
                  <span className="font-light italic text-fog/80">never mixed</span>
                </>
              }
            />
            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="chip chip-fact">FACT</span>
              <span className="chip chip-inference">INFERENCE</span>
              <span className="chip chip-hypothesis">HYPOTHESIS</span>
            </div>
            <p className="mt-5 max-w-3xl text-sm text-mist leading-relaxed">
              Every statement in Internet Time Machine carries an explicit status.{" "}
              <strong className="text-fog">Facts</strong> come directly from archived
              data. <strong className="text-fog">Inferences</strong> are interpretations
              derived from evidence.{" "}
              <strong className="text-fog">Hypotheses</strong> — alternate histories,
              future scenarios — are always labeled clearly as speculation. Speculation
              is never presented as history.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-white/5">
        <div aria-hidden="true" className="absolute inset-0 ambient-wash" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 text-center">
          <p className="eyebrow">Ready when you are</p>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-balance">
            Every website has a{" "}
            <span className="font-light italic text-amber-bright">past</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-mist">
            Go find it. Start with the very first website ever published.
          </p>
          <Link
            href="/entity/info.cern.ch"
            className="btn-primary animate-pulse-glow mt-8 px-8 py-3.5 text-sm"
          >
            Travel to 1991 →
          </Link>
        </div>
      </section>
    </div>
  );
}
