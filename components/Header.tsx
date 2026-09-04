import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight text-lg group"
        >
          <span
            aria-hidden="true"
            className="inline-block w-2.5 h-2.5 rounded-full bg-amber animate-pulse-soft group-hover:animate-none"
          />
          Internet Time Machine
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href="/explore"
            className="px-3 py-2 rounded-md text-mist hover:text-fog hover:bg-raised transition-colors"
          >
            Discover
          </Link>
          <Link
            href="/about"
            className="px-3 py-2 rounded-md text-mist hover:text-fog hover:bg-raised transition-colors"
          >
            Methodology
          </Link>
        </nav>
      </div>
    </header>
  );
}
