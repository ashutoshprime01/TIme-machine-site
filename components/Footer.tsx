import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20">
      <div className="hairline" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-3 text-sm text-faint max-w-2xl">
            <p className="font-mono text-xs tracking-[0.3em] uppercase text-mist/60">
              Internet Time Machine
            </p>
            <p>
              Snapshots are provided by the{" "}
              <a
                href="https://web.archive.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mist underline underline-offset-2 hover:text-fog transition-colors"
              >
                Internet Archive (Wayback Machine)
              </a>
              . We do not claim ownership of archived material — all captures
              belong to their original publishers.{" "}
              <Link
                href="/about"
                className="text-mist underline underline-offset-2 hover:text-fog transition-colors"
              >
                Sources &amp; methodology
              </Link>
              .
            </p>
            <p>
              Analysis scores are internal, deterministic heuristics — not
              objective measures. Every result is labeled as fact, inference,
              or hypothesis.
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.2em] text-faint"
          >
            {[
              { href: "/explore", label: "Discover" },
              { href: "/history", label: "Web History" },
              { href: "/about", label: "Methodology" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-amber-bright transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
