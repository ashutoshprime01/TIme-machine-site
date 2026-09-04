"use client";

// Landing hero (client): the search bar mounts with a spring (Framer
// Motion), a two-mode switch selects WEB HISTORY vs IDENTITY HISTORY, and
// the example chips stagger in beneath it. Reduced-motion users get
// instant mounts.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SearchBar, type SearchMode } from "@/components/SearchBar";

/** Verified popular entities — archive coverage years, widely
    documented Wayback coverage (approximate ranges, marketing copy).
    Favicons are self-hosted in /public/favicons (fetched once at
    build time, no third-party requests at runtime). */
const ENTITIES = [
  { domain: "google.com", name: "Google", range: "1998 → 2026" },
  { domain: "youtube.com", name: "YouTube", range: "2005 → 2026" },
  { domain: "amazon.com", name: "Amazon", range: "1999 → 2026" },
  { domain: "wikipedia.org", name: "Wikipedia", range: "2001 → 2026" },
  { domain: "apple.com", name: "Apple", range: "1997 → 2026" },
  { domain: "info.cern.ch", name: "The First Website", range: "1991 → 2026" },
];

/** Identity presets — well-known public handles with long, publicly
    documented histories. Searching one reconstructs its public traces. */
const IDENTITIES = [
  { handle: "torvalds", note: "public since 2011" },
  { handle: "sindresorhus", note: "public since 2010" },
  { handle: "gaearon", note: "public since 2013" },
  { handle: "mdo", note: "public since 2009" },
];

const MODES: { id: SearchMode; label: string; hint: string }[] = [
  { id: "web", label: "Web History", hint: "Travel through a website's past" },
  { id: "identity", label: "Identity History", hint: "Reconstruct a public presence" },
];

export function HeroSearch() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>("web");
  // when set, the search field has become a departure portal for this query
  const [portal, setPortal] = useState<string | null>(null);

  // submit → the field transforms into a time-travel portal (rings
  // ripple out of the slab, it brightens, the button charges), then
  // navigation happens mid-glow. Reduced motion: navigate immediately.
  const handleTravel = useCallback(
    (q: string) => {
      const dest =
        mode === "identity"
          ? `/identity/${encodeURIComponent(q)}`
          : `/search?q=${encodeURIComponent(q)}`;
      if (reduced) {
        router.push(dest);
        return;
      }
      setPortal(q);
      setTimeout(() => router.push(dest), 900);
    },
    [mode, reduced, router]
  );

  const chipVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: reduced
        ? { duration: 0 }
        : {
            delay: 0.35 + i * 0.07,
            type: "spring" as const,
            stiffness: 300,
            damping: 26,
          },
    }),
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* mode switch — the two doors of the machine */}
      <div
        role="tablist"
        aria-label="Search mode"
        className="mx-auto mb-5 flex w-fit items-center gap-1 rounded-full border border-white/12 bg-ink/60 p-1 backdrop-blur-md"
      >
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={active}
              onClick={() => setMode(m.id)}
              className={`relative rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-300 focus-visible:outline-none ${
                active ? "text-ink" : "text-mist hover:text-fog"
              }`}
            >
              {active && (
                <motion.span
                  aria-hidden="true"
                  layoutId="mode-pill"
                  className="absolute inset-0 rounded-full bg-amber-bright"
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 400, damping: 32 }
                  }
                />
              )}
              <span className="relative">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* search: high-contrast glass slab over the archive backdrop —
          the SearchBar itself carries the amber focus glow; on submit
          it becomes a departure portal */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 26, scale: 0.97 }}
        animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: "spring", stiffness: 220, damping: 26, delay: 0.15 }
        }
        className="relative"
      >
        {/* portal rings: two amber rings ripple out of the slab when a
            journey departs */}
        <AnimatePresence>
          {portal && (
            <>
              {[0, 1].map((ring) => (
                <motion.span
                  key={ring}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl border border-amber-bright/70"
                  initial={{ opacity: 0.9, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.35 + ring * 0.3 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.9,
                    delay: ring * 0.18,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              ))}
              {/* the slab itself brightens as the portal opens */}
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-3 rounded-3xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  background:
                    "radial-gradient(60% 100% at 50% 50%, rgba(232,180,90,0.22), transparent 75%)",
                }}
              />
            </>
          )}
        </AnimatePresence>
        <SearchBar mode={mode} onTravel={handleTravel} />
      </motion.div>

      {/* mode hint */}
      <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
        {MODES.find((m) => m.id === mode)?.hint}
      </p>

      {/* presets: verified entities (web) or public handles (identity) */}
      <motion.ul
        aria-label={mode === "web" ? "Popular historical entities" : "Example public identities"}
        className="mt-4 flex flex-wrap items-center justify-center gap-2.5"
        initial="hidden"
        animate="visible"
      >
        {mode === "web"
          ? ENTITIES.map((e, i) => (
              <motion.li key={e.domain} custom={i} variants={chipVariants}>
                <Link
                  href={`/entity/${e.domain}`}
                  className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-ink/60 py-1.5 pl-1.5 pr-4 backdrop-blur-md transition-all duration-300 hover:border-amber-bright/45 hover:bg-ink/80 hover:shadow-[0_0_24px_-6px_rgba(232,180,90,0.35)] focus-visible:border-amber-bright/60"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-raised ring-1 ring-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/favicons/${e.domain}.png`}
                      alt=""
                      width={14}
                      height={14}
                      loading="lazy"
                      className="h-3.5 w-3.5 rounded-sm"
                    />
                  </span>
                  <span className="text-sm font-medium text-mist transition-colors group-hover:text-fog">
                    {e.name}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums tracking-wide text-faint transition-colors group-hover:text-amber-bright/80">
                    {e.range}
                  </span>
                </Link>
              </motion.li>
            ))
          : IDENTITIES.map((e, i) => (
              <motion.li key={e.handle} custom={i} variants={chipVariants}>
                <Link
                  href={`/identity/${e.handle}`}
                  className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-ink/60 py-1.5 pl-4 pr-4 backdrop-blur-md transition-all duration-300 hover:border-amber-bright/45 hover:bg-ink/80 hover:shadow-[0_0_24px_-6px_rgba(232,180,90,0.35)] focus-visible:border-amber-bright/60"
                >
                  <span className="font-mono text-sm text-amber-bright/90">@{e.handle}</span>
                  <span className="font-mono text-[10px] tabular-nums tracking-wide text-faint transition-colors group-hover:text-amber-bright/80">
                    {e.note}
                  </span>
                </Link>
              </motion.li>
            ))}
      </motion.ul>
    </div>
  );
}
