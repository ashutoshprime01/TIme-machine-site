// Methodology, provenance and honest limits (plan §2, §16, §18, §67–70, §77).

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology & Sources",
  description:
    "How Internet Time Machine measures website evolution: deterministic analysis, labeled facts and inferences, and full source attribution.",
  alternates: { canonical: "/about" },
};

const SECTIONS = [
  {
    h: "Where the snapshots come from",
    p: [
      "Captures are retrieved live from the Internet Archive's Wayback Machine through its public CDX API. Internet Time Machine stores only what you look at: capture metadata, analysis results, and a local cache of retrieved pages. We do not claim ownership of any archived material — every snapshot belongs to its original publisher, and each viewer page links back to the source capture.",
      "Archive coverage is incomplete by nature. A capture exists only for moments when the site happened to be crawled, so available captures are not continuous, and a capture shows the page at one moment — not how it looked all year.",
    ],
  },
  {
    h: "How analysis works",
    p: [
      "Every measurement is deterministic. The archived HTML is parsed and counted — words, links, images, headings, tables, DOM depth, navigation elements, distinct colors, page size — plus technology fingerprints (frameworks, analytics, fonts, media) with an explicit confidence level.",
      "Change percentages between two captures are internal comparison metrics: fixed formulas applied to the two measurement sets. They are heuristics for exploration, not scientific measures of cultural change.",
    ],
  },
  {
    h: "What Internet DNA is",
    p: [
      "Each snapshot receives scores on twelve dimensions — minimalism, information density, visual complexity, commercialization, social intensity, personalization, interactivity, mobile focus, media intensity, AI integration, accessibility signals, navigation complexity.",
      "Each score is a documented formula over measured signals (for example, Mobile Focus combines the viewport meta tag, responsive media queries, web fonts, and absence of table layout). They are analytical heuristics — useful for comparison, not objective truth about a website's character.",
    ],
  },
  {
    h: "Facts, inferences, hypotheses",
    p: [
      "Every statement the product makes carries an explicit status. FACT means it comes directly from archived data (“the homepage contained 14 navigation links”). INFERENCE means it's an interpretation derived from evidence (“navigation appears to have expanded”). HYPOTHESIS — used by future features like the Evolution Lab — marks speculative content that must never read as history.",
    ],
  },
  {
    h: "Versioning & reproducibility",
    p: [
      "Analyses and DNA scores are stamped with an algorithm version (currently Analysis v1.0, DNA v1.0). If formulas improve, versioned results can be regenerated and compared — historical results are never silently overwritten.",
    ],
  },
  {
    h: "Security & privacy",
    p: [
      "Archived pages are untrusted content. They render inside sandboxed cross-origin iframes with scripting disabled, so nothing from an archive ever executes in this application. Requests to the public archive are throttled, cached and retried politely.",
      "This MVP collects no personal data and requires no account.",
    ],
  },
  {
    h: "Roadmap",
    p: [
      "Built so far: search, entity timelines, the historical viewer, comparisons, deterministic analysis, Internet DNA and shareable links. Next: evolution events and scores, then the Evolution Lab (hypothetical branches, clearly labeled), then future scenarios — each growing from evidence into interpretation, and only then into imagination.",
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
        Methodology &amp; sources
      </h1>
      <p className="mt-3 text-mist">
        Curious, not corporate. Historical, not merely technical. Scientific —
        every metric has a method. Honest — fact and speculation are never
        mixed.
      </p>

      <div className="mt-10 space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="text-xl font-semibold">{s.h}</h2>
            {s.p.map((para, i) => (
              <p key={i} className="mt-3 text-mist leading-relaxed">
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>

      <p className="mt-12 rounded-xl border border-line bg-panel p-5 text-sm text-faint">
        Note: this project is built around lawful use of public archive
        services and their terms. Exact legal obligations depend on
        jurisdiction and scale — obtain professional legal advice before
        operating anything beyond personal or educational use.
      </p>
    </div>
  );
}
