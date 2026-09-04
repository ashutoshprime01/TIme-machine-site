"use client";

// Identity timeline — the central feature (master prompt, IDENTITY
// TIMELINE). A chronological constellation: nodes on a glowing spine, each
// expandable in place (continuity, not a page load). Hover previews the
// source and confidence; clicking opens the full evidence panel inline.

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { IdentityTraceItem } from "@/lib/types";
import { formatCaptureDate, captureYear } from "@/lib/security/url";
import { EvidencePanel } from "./EvidencePanel";

const TYPE_STYLES: Record<string, { dot: string; chip: string }> = {
  PROFILE: { dot: "bg-azure", chip: "border-azure/40 text-azure" },
  WEBSITE: { dot: "bg-amber-bright", chip: "border-amber-bright/40 text-amber-bright" },
  DOMAIN: { dot: "bg-amber-bright", chip: "border-amber-bright/40 text-amber-bright" },
  MENTION: { dot: "bg-fuchsia-400", chip: "border-fuchsia-400/40 text-fuchsia-300" },
  PROJECT: { dot: "bg-emerald-400", chip: "border-emerald-400/40 text-emerald-300" },
  POST: { dot: "bg-fuchsia-400", chip: "border-fuchsia-400/40 text-fuchsia-300" },
  IMAGE: { dot: "bg-white/70", chip: "border-white/30 text-mist" },
  USERNAME: { dot: "bg-white/70", chip: "border-white/30 text-mist" },
};

export function IdentityTimeline({ traces }: { traces: IdentityTraceItem[] }) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<number | null>(null);

  if (traces.length === 0) return null;

  return (
    <ol className="relative ml-2 sm:ml-4 border-l border-white/10">
      {traces.map((t, i) => {
        const styles = TYPE_STYLES[t.type] ?? TYPE_STYLES.USERNAME;
        const isOpen = open === i;
        const year = captureYear(t.observedAt);
        return (
          <motion.li
            key={t.id}
            className="relative pb-8 pl-6 sm:pl-10"
            initial={reduced ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={reduced ? { duration: 0 } : { delay: Math.min(i * 0.06, 0.4), type: "spring", stiffness: 260, damping: 28 }}
          >
            {/* node on the spine */}
            <span
              aria-hidden="true"
              className={`absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full ${styles.dot} ${
                isOpen ? "shadow-[0_0_16px_2px_rgba(232,180,90,0.45)]" : "opacity-80"
              }`}
            />
            {/* the spine segment brightens for the open node */}
            {isOpen && (
              <span
                aria-hidden="true"
                className="absolute -left-px top-0 bottom-0 w-px bg-gradient-to-b from-amber-bright/60 to-transparent"
              />
            )}

            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="group w-full text-left focus-visible:outline-none"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-xs tabular-nums text-faint group-hover:text-amber-bright/90 transition-colors">
                  {year}
                </span>
                <span className="text-sm font-semibold text-fog group-hover:text-white transition-colors">
                  {t.title}
                </span>
                <span
                  className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] ${styles.chip}`}
                >
                  {t.type}
                </span>
              </div>
              <p className="mt-1 text-xs text-mist/80 group-hover:text-mist transition-colors">
                Source: {t.source} · Confidence: {t.confidence} ·{" "}
                <span className="text-faint group-hover:text-amber-bright/80 transition-colors">
                  {isOpen ? "hide evidence" : "view evidence →"}
                </span>
              </p>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="evidence"
                  initial={reduced ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <EvidencePanel
                      evidence={t.evidence}
                      source={t.source}
                      confidence={t.confidence}
                      reportContext={`${t.title} (${t.url})`}
                    />
                    {t.domain && (
                      <a
                        href={`/entity/${t.domain}`}
                        className="mt-3 inline-block text-xs text-amber-bright hover:text-amber-bright/80 underline decoration-amber-bright/40 underline-offset-4 transition-colors"
                      >
                        Open {t.domain} in Website History →
                      </a>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        );
      })}
    </ol>
  );
}
