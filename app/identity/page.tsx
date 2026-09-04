// Identity History introduction — what this mode does, and just as
// importantly, what it never does (master prompt: "a public-web archaeology
// tool, not a private-person investigation tool").

import type { Metadata } from "next";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";

export const metadata: Metadata = {
  title: "Identity History",
  description:
    "Reconstruct the publicly discoverable Internet history of a name, handle, alias or domain — with evidence and confidence for every trace.",
  alternates: { canonical: "/identity" },
};

const EXAMPLES = ["@torvalds", "@sindresorhus", "@gaearon", "johnsmith.dev"];

const STEPS = [
  {
    n: "01",
    h: "You enter a public identifier",
    p: "A name, a username, a handle, a public alias, or a domain. The system generates candidate handles and probes only public, permit-free sources.",
  },
  {
    n: "02",
    h: "Public evidence is collected",
    p: "Archived public profile pages from the Wayback Machine. Public profile data from the GitHub API. Nothing behind a login is ever touched — by design, not by policy exception.",
  },
  {
    n: "03",
    h: "Every discovery carries its proof",
    p: "Each trace exposes its source, date, URL, evidence and a confidence grade. Same username on two platforms links the pages — it never claims one person.",
  },
  {
    n: "04",
    h: "The timeline comes to you",
    p: "Traces assemble into a chronological constellation, a username history, and connections into Website History — one interconnected machine.",
  },
];

const NEVER = [
  "Search private accounts or bypass any login",
  "Scrape content behind access restrictions",
  "Expose addresses, phone numbers, private emails, passwords or financial information",
  "Use facial recognition or infer identity from image similarity",
  "State uncertain identity matches as facts",
];

export default function IdentityIntroPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20">
      <p className="eyebrow eyebrow-accent">Identity History</p>
      <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-balance">
        Reconstruct the public history of{" "}
        <span className="font-light italic font-serif text-fog/80">
          an Internet presence.
        </span>
      </h1>
      <p className="mt-4 text-mist leading-relaxed">
        Enter a name, username, handle, public alias or domain. Internet Time
        Machine searches the public web — archives and public APIs — for traces
        publicly associated with it, and assembles them into an evidence-backed
        timeline. If nothing is found, it says so.
      </p>

      <div className="mt-8">
        <SearchBar mode="identity" />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-faint">Try:</span>
        {EXAMPLES.map((ex) => (
          <Link
            key={ex}
            href={`/identity/${encodeURIComponent(ex.replace(/^@/, ""))}`}
            className="chip-poly !text-sm !normal-case !tracking-normal !px-3 !py-1.5"
          >
            {ex}
          </Link>
        ))}
      </div>

      <ol className="mt-14 space-y-6">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-5">
            <span className="font-mono text-xs tabular-nums text-amber-bright/80 pt-1">{s.n}</span>
            <div>
              <h2 className="font-semibold">{s.h}</h2>
              <p className="mt-1.5 text-sm text-mist leading-relaxed">{s.p}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-14 rounded-2xl border border-white/10 bg-panel/60 p-6 sm:p-8">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-bright/90">
          What this system will never do
        </h2>
        <ul className="mt-4 space-y-2.5">
          {NEVER.map((n) => (
            <li key={n} className="flex items-start gap-3 text-sm text-mist">
              <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-faint" />
              {n}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-faint">
          A username match links public pages; it is never read as &ldquo;same
          person.&rdquo; Results can be reported or removed at any time —{" "}
          <Link href="/report" className="text-azure hover:text-azure/80 underline underline-offset-4">
            report / remove a public result
          </Link>
          .
        </p>
      </section>

      <div className="mt-12 border-t border-white/8 pt-8">
        <Link href="/about" className="btn-ghost px-5 py-2.5 text-sm font-semibold">
          Read the full methodology →
        </Link>
      </div>
    </div>
  );
}
