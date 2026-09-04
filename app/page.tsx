import type { Metadata } from "next";
import { ArchiveBackdrop } from "@/components/landing/ArchiveBackdrop";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { HeroShell } from "@/components/landing/HeroShell";
import { HeroEyebrow } from "@/components/landing/HeroEyebrow";
import { Pipeline } from "@/components/landing/Pipeline";
import { DestinationCards } from "@/components/landing/DestinationCards";
import { EraGallery } from "@/components/landing/EraGallery";
import { YearRail } from "@/components/landing/YearRail";
import { EraCompare } from "@/components/landing/EraCompare";
import { EvolutionReel } from "@/components/landing/EvolutionReel";
import { DnaMorph } from "@/components/landing/DnaMorph";
import { Manifesto } from "@/components/landing/Manifesto";
import { ArsenalWall } from "@/components/landing/ArsenalWall";
import { Finale } from "@/components/landing/Finale";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { BootSequence } from "@/components/atmosphere/BootSequence";
import { Spotlight } from "@/components/atmosphere/Spotlight";
import { Cursor } from "@/components/atmosphere/Cursor";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

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

function Hairline() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="hairline" />
    </div>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* atmosphere: boot sequence, custom cursor, film grain,
          scroll-linked era readout */}
      <BootSequence />
      <Cursor />
      <ScrollProgress />
      <div className="grain" aria-hidden="true" />

      {/* Chapter 00 — the hero: archive wall behind the headline,
          cursor spotlight, modem-decode eyebrow; dissolves on scroll */}
      <section className="relative border-b border-white/5 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 bg-grid bg-grid-fade opacity-50" />
        <ArchiveBackdrop />
        <Spotlight />

        <HeroShell>
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-28 pb-24 sm:pt-40 sm:pb-32 text-center">
            <HeroEyebrow />
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
        </HeroShell>
      </section>

      {/* Chapter — the arsenal wall: two opposing rows of huge
          outlined words that fill on hover */}
      <ArsenalWall />

      {/* 01 — The Principle (plan §0) */}
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

      <Hairline />

      {/* 02 — Destinations (plan §7) */}
      <section id="explore" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="02 — Destinations"
            title="What would you like to explore?"
          />
        </Reveal>
        <DestinationCards />
      </section>

      <Hairline />

      {/* 03 — The Gallery: eras as a specimen list */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="03 — The Gallery"
            title={
              <>
                A field guide to{" "}
                <span className="font-light italic text-fog/80">the web's eras</span>
              </>
            }
            description="Hover an era to meet its exhibit — specimen plates and real artifacts retrieved from the archives. Select one to walk into the genuine article."
          />
        </Reveal>
        <EraGallery />
      </section>

      <Hairline />

      {/* 04 — The Timeline itself, as an exhibit */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="04 — The Timeline"
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

      <Hairline />

      {/* 05 — The Exhibit Hall: then & now slider + the reel */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="05 — The Exhibit Hall"
            title={
              <>
                Then &amp; now,{" "}
                <span className="font-light italic text-fog/80">face to face</span>
              </>
            }
            description="Wipe the divider between the oldest and newest web. Below it, the continuous reel — thirty-five years passing in nine seconds."
          />
        </Reveal>
        <EraCompare />
        <Reveal delay={0.1}>
          <EvolutionReel />
        </Reveal>
      </section>

      <Hairline />

      {/* 06 — Internet DNA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="06 — Internet DNA"
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

      <Hairline />

      {/* 07 — The Idea: word-by-word manifesto */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        <Reveal>
          <SectionHeading eyebrow="07 — The Idea" title="Why we built this" />
        </Reveal>
        <div className="mt-10">
          <Manifesto />
        </div>
      </section>

      <Hairline />

      {/* 08 — The Honesty Rule (plan §77) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <Reveal className="glass rounded-2xl p-6 sm:p-10 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="orb w-72 h-72 bg-azure/10 -top-24 -right-24"
          />
          <div className="relative">
            <SectionHeading
              eyebrow="08 — The Honesty Rule"
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

      {/* The finale: huge type, live archive clock, status, CTA */}
      <Finale />
    </div>
  );
}
