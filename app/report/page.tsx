// Report / Remove a public result (master prompt, PRIVACY AND SAFETY).
// Zero-cost mechanism: a guided form that explains exactly what is stored,
// how to request removal from this system, and how to request removal at
// the original public source (the Internet Archive's own process).

import type { Metadata } from "next";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";

export const metadata: Metadata = {
  title: "Report / remove a public result",
  description:
    "How to report or request removal of a public result from Internet Time Machine's Identity History.",
  alternates: { canonical: "/report" },
};

const STEPS = [
  {
    title: "1 · What this system stores",
    body: "Identity History stores only publicly accessible pages it found via public archives and public APIs: the page's URL, its earliest archived date, its public source, and an evidence note. No private data is ever collected, and free-text is scrubbed of emails and phone-like numbers before storage.",
  },
  {
    title: "2 · Remove it from this system",
    body: "Contact the site operator with the identity page URL (and, if you have it, the trace's evidence URL). Stored traces are deleted on request — no justification is required. If a report email is configured below, it arrives prefilled.",
  },
  {
    title: "3 · Remove it at the source",
    body: "This system only republishes what public archives already hold. The authoritative fix is removal at the source: the Internet Archive accepts removal requests for archived pages via its documented process (web.archive.org), and platform owners control their own public pages.",
  },
];

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string }>;
}) {
  const { context } = await searchParams;
  const reportEmail = process.env.REPORT_EMAIL?.trim();
  const subject = "Removal request — Internet Time Machine identity result";
  const body = [
    "I would like a public result removed from Internet Time Machine.",
    "",
    context ? `Result in question: ${context}` : "Result in question: (paste the identity page URL here)",
    "",
    "Reason (optional):",
  ].join("\n");
  const mailto = reportEmail
    ? `mailto:${reportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 sm:py-20">
      <p className="eyebrow">Privacy & safety</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">
        Report / remove a public result
      </h1>
      <p className="mt-4 text-mist leading-relaxed">
        Internet Time Machine is a public-web archaeology tool. If a result on
        this site concerns you, this page explains exactly what exists and how
        to have it removed.
      </p>

      {context && (
        <p className="mt-6 rounded-xl border border-amber-bright/25 bg-amber-bright/5 px-4 py-3 font-mono text-xs text-mist break-all">
          Regarding: {context}
        </p>
      )}

      <ol className="mt-8 space-y-5">
        {STEPS.map((s) => (
          <li key={s.title} className="rounded-xl border border-white/10 bg-panel/60 p-5">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-bright/90">
              {s.title}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-mist">{s.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        {mailto ? (
          <a href={mailto} className="btn-primary px-5 py-2.5 text-sm font-semibold">
            Email a removal request
          </a>
        ) : (
          <p className="text-xs text-faint">
            No report email is configured on this deployment — contact the site
            operator directly. Operators: set <code className="font-mono text-mist">REPORT_EMAIL</code> to
            enable prefilled removal requests.
          </p>
        )}
        <Link href="/about" className="btn-ghost px-5 py-2.5 text-sm font-semibold">
          Methodology & privacy principles
        </Link>
      </div>

      <div className="mt-12 border-t border-white/8 pt-8">
        <p className="text-sm text-faint">Searching for something else?</p>
        <div className="mt-4">
          <SearchBar size="compact" />
        </div>
      </div>
    </div>
  );
}
