import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 glass-strong">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight text-lg group"
        >
          <span
            aria-hidden="true"
            className="relative inline-block w-2.5 h-2.5 rounded-full bg-amber animate-pulse-soft group-hover:animate-none"
          />
          <span className="hidden sm:inline">
            Internet <span className="font-mono font-normal text-mist group-hover:text-fog transition-colors">Time</span> Machine
          </span>
          <span className="sm:hidden">ITM</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          {[
            { href: "/explore", label: "Discover" },
            { href: "/history", label: "Web History" },
            { href: "/about", label: "Methodology" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-md text-mist hover:text-fog hover:bg-white/5 transition-colors text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
