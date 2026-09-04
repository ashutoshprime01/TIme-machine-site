"use client";

// Landing hero (client): the search bar mounts with a spring (Framer
// Motion) and the verified-entity chips stagger in beneath it. Chips
// are instant historical presets — favicon + archive date range —
// linking straight into the entity timeline. Reduced-motion users get
// instant mounts.

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { SearchBar } from "@/components/SearchBar";

/** Verified popular entities — archive coverage years, widely
    documented Wayback coverage (approximate ranges, marketing copy). */
const ENTITIES = [
  { domain: "google.com", name: "Google", range: "1998 → 2026" },
  { domain: "youtube.com", name: "YouTube", range: "2005 → 2026" },
  { domain: "amazon.com", name: "Amazon", range: "1999 → 2026" },
  { domain: "wikipedia.org", name: "Wikipedia", range: "2001 → 2026" },
  { domain: "apple.com", name: "Apple", range: "1997 → 2026" },
  { domain: "info.cern.ch", name: "The First Website", range: "1991 → 2026" },
];

export function HeroSearch() {
  const reduced = useReducedMotion();

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
      {/* search: high-contrast glass slab over the archive backdrop —
          the SearchBar itself carries the amber focus glow */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 26, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: "spring", stiffness: 220, damping: 26, delay: 0.15 }
        }
      >
        <SearchBar />
      </motion.div>

      {/* verified entity presets */}
      <motion.ul
        aria-label="Popular historical entities"
        className="mt-6 flex flex-wrap items-center justify-center gap-2.5"
        initial="hidden"
        animate="visible"
      >
        {ENTITIES.map((e, i) => (
          <motion.li
            key={e.domain}
            custom={i}
            variants={chipVariants}
          >
            <Link
              href={`/entity/${e.domain}`}
              className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-ink/60 py-1.5 pl-1.5 pr-4 backdrop-blur-md transition-all duration-300 hover:border-amber-bright/45 hover:bg-ink/80 hover:shadow-[0_0_24px_-6px_rgba(232,180,90,0.35)] focus-visible:border-amber-bright/60"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-raised ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${e.domain}&sz=64`}
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
        ))}
      </motion.ul>
    </div>
  );
}
