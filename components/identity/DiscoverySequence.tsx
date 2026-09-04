"use client";

// Discovery sequence — the immersive reveal after an identity search
// (master prompt, IDENTITY DISCOVERY). Every number shown is real, counted
// from the server-fetched report. If nothing was found, it says so — the
// sequence never fakes results. Plays once per session; skipped entirely
// for reduced-motion users and repeat visits.

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const SEEN_KEY = "itm-identity-seen";

export interface DiscoveryCounts {
  displayName: string;
  profiles: number;
  websites: number;
  domains: number;
  mentions: number;
  totalTraces: number;
  sourcesQueried: number;
}

export function DiscoverySequence({
  counts,
  children,
}: {
  counts: DiscoveryCounts;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<"checking" | "playing" | "done">("checking");

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen || reduced) {
      setPhase("done");
      return;
    }
    setPhase("playing");
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* private mode — fine */
      }
      setPhase("done");
    }, 2600);
    return () => clearTimeout(t);
  }, [reduced]);

  if (phase !== "playing") return <>{children}</>;

  return (
    <>
      {/* the report beneath, hidden until the sequence completes */}
      <div aria-hidden="true" className="select-none pointer-events-none opacity-0">
        {children}
      </div>

      <AnimatePresence>
        <motion.div
          key="discovery"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45 } }}
        >
          <div className="w-full max-w-xl px-6 font-mono">
            <motion.p
              className="text-[10px] uppercase tracking-[0.35em] text-amber-bright/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.6, 1] }}
              transition={{ duration: 2.4 }}
            >
              Identity Archive
            </motion.p>

            <motion.p
              className="mt-4 text-sm text-mist"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              Searching public traces of:{" "}
              <span className="text-fog">{counts.displayName}</span>
            </motion.p>

            {/* signal counts — staggered, real numbers only */}
            <div className="mt-8 space-y-2.5">
              {[
                { label: "public profiles", n: counts.profiles, delay: 0.5 },
                { label: "websites", n: counts.websites, delay: 0.75 },
                { label: "domains", n: counts.domains, delay: 1.0 },
                { label: "public mentions", n: counts.mentions, delay: 1.25 },
              ].map((row) => (
                <motion.div
                  key={row.label}
                  className="flex items-baseline gap-4 border-b border-white/8 pb-2.5"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: row.delay }}
                >
                  <span className="w-8 text-right text-lg tabular-nums text-fog">
                    {String(row.n).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-faint">
                    {row.label}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.p
              className="mt-8 text-[11px] uppercase tracking-[0.25em] text-faint"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: 1 }}
            >
              {counts.totalTraces > 0 ? "Building timeline…" : "No traces found"}
            </motion.p>
            <p className="mt-2 text-[10px] text-faint/70">
              {counts.sourcesQueried} public source{counts.sourcesQueried === 1 ? "" : "s"} queried
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
