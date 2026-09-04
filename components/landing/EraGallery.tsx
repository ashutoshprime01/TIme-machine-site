"use client";

// Gallery of Eras: a museum specimen list. Each row is an era — year,
// name, mono tags. On desktop, hovering a row summons its exhibit
// (an era plate or a real artifact pulled from the Wayback Machine)
// in a floating frame that trails the cursor with spring physics.
// Touch visitors get an inline thumbnail instead. Every row links
// into the archive for real.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

type Exhibit =
  | { kind: "plate"; src: string; caption: string }
  | { kind: "artifact"; src: string; caption: string; bg: string };

const ERAS: {
  year: string;
  name: string;
  tags: string[];
  href: string;
  exhibit: Exhibit;
  real?: boolean;
}[] = [
  {
    year: "1991",
    name: "The First Website",
    tags: ["HTML", "HYPERTEXT", "CERN"],
    href: "/entity/info.cern.ch",
    exhibit: { kind: "plate", src: "/artifacts/era-1991.jpg", caption: "Specimen plate — 1991" },
  },
  {
    year: "1996",
    name: "The Static Web",
    tags: ["TABLES", "GIFS", "COUNTERS"],
    href: "/entity/info.cern.ch/snapshot/19960101000000",
    exhibit: { kind: "plate", src: "/artifacts/era-1996.jpg", caption: "Specimen plate — 1996" },
  },
  {
    year: "1999",
    name: "Search Awakens",
    tags: ["PAGE RANK", "STANFORD", "BETA"],
    href: "/entity/google.com",
    exhibit: {
      kind: "artifact",
      src: "/artifacts/google-1999-logo.png",
      caption: "Real artifact — archived 1999",
      bg: "#f2efe6",
    },
    real: true,
  },
  {
    year: "2001",
    name: "The Free Encyclopedia",
    tags: ["WIKI", "NPOV", "OPEN"],
    href: "/entity/wikipedia.org",
    exhibit: {
      kind: "artifact",
      src: "/artifacts/wikipedia-2001-globe.png",
      caption: "Real artifact — archived 2001",
      bg: "#f2efe6",
    },
    real: true,
  },
  {
    year: "2004",
    name: "The Portal Era",
    tags: ["GRADIENTS", "PORTALS", "POPUPS"],
    href: "/entity/amazon.com",
    exhibit: { kind: "plate", src: "/artifacts/era-2004.jpg", caption: "Specimen plate — 2004" },
  },
  {
    year: "2005",
    name: "Video Arrives",
    tags: ["BROADCAST", "YOURSELF", "EMBED"],
    href: "/entity/youtube.com",
    exhibit: {
      kind: "artifact",
      src: "/artifacts/youtube-2005-logo.png",
      caption: "Real artifact — archived 2005",
      bg: "#f2efe6",
    },
    real: true,
  },
  {
    year: "2012",
    name: "Flat & Mobile",
    tags: ["CARDS", "WHITESPACE", "APPS"],
    href: "/entity/apple.com",
    exhibit: { kind: "plate", src: "/artifacts/era-2012.jpg", caption: "Specimen plate — 2012" },
  },
  {
    year: "2026",
    name: "The AI Web",
    tags: ["PROMPTS", "AGENTS", "GENERATION"],
    href: "/entity/google.com/evolution",
    exhibit: { kind: "plate", src: "/artifacts/era-2026.jpg", caption: "Specimen plate — 2026" },
  },
];

function ExhibitPreview({ exhibit }: { exhibit: Exhibit }) {
  return (
    <div
      className={`relative h-48 w-72 overflow-hidden rounded-lg border border-white/15 shadow-2xl shadow-black/60 ${
        exhibit.kind === "artifact" ? "flex items-center justify-center" : ""
      }`}
      style={exhibit.kind === "artifact" ? { backgroundColor: exhibit.bg } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={exhibit.src}
        alt=""
        className={exhibit.kind === "plate" ? "h-full w-full object-cover" : "max-h-24 max-w-[80%] object-contain"}
      />
      <span className="absolute bottom-0 inset-x-0 bg-black/55 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-fog/90 backdrop-blur-sm">
        {exhibit.caption}
      </span>
    </div>
  );
}

export function EraGallery() {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const [fine, setFine] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 150, damping: 20, mass: 0.5 });
  const sy = useSpring(py, { stiffness: 150, damping: 20, mass: 0.5 });

  useEffect(() => {
    setFine(window.matchMedia("(pointer: fine)").matches);
  }, []);

  function onMove(e: React.PointerEvent) {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    px.set(e.clientX - rect.left + 28);
    py.set(e.clientY - rect.top - 96);
  }

  const showPreview = fine && !reduced;

  return (
    <div
      ref={sectionRef}
      className="relative mt-10"
      onPointerMove={showPreview ? onMove : undefined}
    >
      {/* floating exhibit: follows the cursor, springs behind it */}
      <AnimatePresence>
        {showPreview && hovered !== null && (
          <motion.div
            key={hovered}
            aria-hidden="true"
            className="pointer-events-none absolute z-20 hidden lg:block"
            style={{ x: sx, y: sy }}
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 2 }}
            exit={{ opacity: 0, scale: 0.92, rotate: 3 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <ExhibitPreview exhibit={ERAS[hovered].exhibit} />
          </motion.div>
        )}
      </AnimatePresence>

      <ul className="border-t border-white/10">
        {ERAS.map((era, i) => (
          <motion.li
            key={era.year}
            initial={reduced ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: 0.05 * i, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="border-b border-white/10"
            onPointerEnter={showPreview ? () => setHovered(i) : undefined}
            onPointerLeave={showPreview ? () => setHovered(null) : undefined}
          >
            <Link
              href={era.href}
              data-cursor="view"
              className="group flex items-center gap-4 sm:gap-8 py-5 sm:py-6 px-2 sm:px-4 -mx-2 sm:-mx-4 rounded-lg transition-colors hover:bg-white/[0.025]"
            >
              <span className="font-mono text-sm sm:text-base tabular-nums text-amber-bright w-12 sm:w-16 shrink-0">
                {era.year}
              </span>
              {/* inline thumbnail — touch visitors still meet the exhibit */}
              <span className="lg:hidden relative h-12 w-20 shrink-0 overflow-hidden rounded border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={era.exhibit.src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                  style={
                    era.exhibit.kind === "artifact"
                      ? { objectFit: "contain", backgroundColor: (era.exhibit as { bg: string }).bg }
                      : undefined
                  }
                />
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-3">
                  <span className="text-lg sm:text-2xl font-semibold tracking-tight text-fog group-hover:text-amber-bright transition-colors">
                    {era.name}
                  </span>
                  {era.real && (
                    <span className="hidden sm:inline-flex items-center rounded-full border border-ice/30 bg-ice/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-ice">
                      real artifact
                    </span>
                  )}
                </span>
                <span className="mt-1.5 flex flex-wrap gap-x-3 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                  {era.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="font-mono text-faint transition-all duration-300 group-hover:text-amber-bright group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-faint">
        Plates are stylized reproductions; artifacts marked{" "}
        <span className="text-ice">real artifact</span> were retrieved
        from public web archives. Every row opens the genuine archive.
      </p>
    </div>
  );
}
