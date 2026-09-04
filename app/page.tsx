import Link from "next/link";
import type { Metadata } from "next";
import { Marquee } from "@/components/ui/Marquee";
import { ArchiveBackdrop } from "@/components/landing/ArchiveBackdrop";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { Pipeline } from "@/components/landing/Pipeline";
import { DestinationCards } from "@/components/landing/DestinationCards";
import { YearRail } from "@/components/landing/YearRail";
import { DnaMorph } from "@/components/landing/DnaMorph";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const ARSENAL = [
  "Wayback CDX", "Deterministic Analysis", "Internet DNA", "Evolution Engine",
  "Change Detection", "Tech Fingerprinting", "Evolution Lab", "Future Simulator",
  "Sandboxed Viewer", "Content-Hash Caching", "FACT / INFERENCE", "Zero Paid APIs",
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
      {/* Hero (plan §7) — the archive wall: faded era wireframes drift
          behind the headline and search; edges dissolve into the dark */}
      <section className="relative border-b border-white/5 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 bg-grid bg-grid-fade opacity-50" />
        <ArchiveBackdrop />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-28 pb-24 sm:pt-40 sm:pb-32 text-center">
          <p className="animate-fade-up eyebrow eyebrow-accent">
            Street View for the Internet
          </p>
          <h1 className="animate-fade-up mx-auto mt-6 max-w-4xl text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.02] text-balance font-display">
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

          <div className="animate-fade-up mt-12">
            <HeroSearch />
          </div>

          {/* scroll cue */}
          <div
            aria-hidden="true"
            className="mt-20 mx-auto w-px h-10 bg-gradient-to-b from-white/40 to-transparent"
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
        <Reveal>
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
        </Reveal>
        <Pipeline />
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="hairline" /></div>

      {/* Main actions (plan §7) */}
      <section id="explore" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="02 — Destinations"
            title="What would you like to explore?"
          />
        </Reveal>
        <DestinationCards />
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="hairline" /></div>

      {/* The timeline itself, as an exhibit */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="03 — The Timeline"
            title={
              <>
                Thirty-five years,{" "}
                <span className="font-light italic text-fog/80">under your thumb</span>
              </>
            }
            description="Drag through the decades — the year under the marker grows dominant, the rest recede into the dark. Release, and the rail settles onto the era you chose."
          />
        </Reveal>
        <Reveal delay={0.1} className="mt-6">
          <YearRail />
        </Reveal>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="hairline" /></div>

      {/* Internet DNA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="04 — Internet DNA"
            title={
              <>
                Every era has{" "}
                <span className="font-light italic text-fog/80">a shape</span>
              </>
            }
            description="Twelve dimensions — from minimalism to AI integration — profile a website's character. Switch eras and watch the profile morph."
          />
        </Reveal>
        <Reveal delay={0.1} className="mt-6">
          <DnaMorph />
        </Reveal>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="hairline" /></div>

      {/* Honesty note (plan §77) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <Reveal className="glass rounded-2xl p-6 sm:p-10 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="orb w-72 h-72 bg-azure/10 -top-24 -right-24"
          />
          <div className="relative">
            <SectionHeading
              eyebrow="05 — The Honesty Rule"
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
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-white/5">
        <div aria-hidden="true" className="absolute inset-0 ambient-wash" />
        <Reveal className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 text-center">
          <p className="eyebrow">Ready when you are</p>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-balance">
            Every website has a{" "}
            <span className="font-light italic text-amber-bright">past</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-mist">
            Go find it. Start with the very first website ever published.
          </p>
          <Magnetic className="mt-8 inline-block" strength={0.25}>
            <Link
              href="/entity/info.cern.ch"
              className="btn-primary animate-pulse-glow px-8 py-3.5 text-sm"
            >
              Travel to 1991 →
            </Link>
          </Magnetic>
        </Reveal>
      </section>
    </div>
  );
}
