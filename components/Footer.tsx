import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 text-sm text-faint space-y-3">
        <p>
          Snapshots are provided by the{" "}
          <a
            href="https://web.archive.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-mist underline underline-offset-2 hover:text-fog"
          >
            Internet Archive (Wayback Machine)
          </a>
          . Internet Time Machine does not claim ownership of archived material —
          all captures belong to their original publishers.{" "}
          <Link href="/about" className="text-mist underline underline-offset-2 hover:text-fog">
            Sources &amp; methodology
          </Link>
          .
        </p>
        <p>
          Analysis scores are internal, deterministic heuristics — not objective
          measures. Every result is labeled as fact, inference, or hypothesis.
        </p>
      </div>
    </footer>
  );
}
