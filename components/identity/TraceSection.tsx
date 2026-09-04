"use client";

// Trace section — a category listing of public traces (profiles, websites &
// domains, mentions). Cards expand inline to the full evidence panel;
// website/domain cards connect into Website History (Phase 3 of the master
// prompt: one interconnected historical system).

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { IdentityTraceItem } from "@/lib/types";
import { captureYear } from "@/lib/security/url";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { EvidencePanel } from "./EvidencePanel";

export function TraceSection({
  title,
  description,
  traces,
  emptyText,
}: {
  title: string;
  description: string;
  traces: IdentityTraceItem[];
  /** Honest empty state — never fabricated. */
  emptyText: string;
}) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section aria-labelledby={`sec-${title.replace(/\s+/g, "-").toLowerCase()}`}>
      <div className="max-w-2xl">
        <h3 id={`sec-${title.replace(/\s+/g, "-").toLowerCase()}`} className="text-lg font-semibold tracking-tight">
          {title}
        </h3>
        <p className="mt-1.5 text-sm text-mist">{description}</p>
      </div>

      {traces.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-white/12 bg-panel/40 px-5 py-4 text-sm text-faint">
          {emptyText}
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 lg:grid-cols-2">
          {traces.map((t) => {
            const isOpen = open === t.id;
            return (
              <li key={t.id} className={t.domain ? "lg:col-span-1" : ""}>
                <div className="h-full rounded-xl border border-white/10 bg-panel/60 transition-colors hover:border-white/20">
                  <button
                    onClick={() => setOpen(isOpen ? null : t.id)}
                    aria-expanded={isOpen}
                    className="group w-full p-4 text-left focus-visible:outline-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-fog group-hover:text-white transition-colors">
                          {t.title}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-faint">
                          {captureYear(t.observedAt)} · {t.source}
                        </p>
                      </div>
                      <ConfidenceBadge level={t.confidence} />
                    </div>
                    <p className="mt-2 text-xs text-mist/80 group-hover:text-mist transition-colors">
                      {isOpen ? "hide evidence ↑" : "view evidence ↓"}
                    </p>
                  </button>

                  {/* the cross-mode bridge: websites open the Time Machine */}
                  {t.domain && !isOpen && (
                    <div className="px-4 pb-4">
                      <Link
                        href={`/entity/${t.domain}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-bright/30 bg-amber-bright/5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-amber-bright transition-all hover:bg-amber-bright/10 hover:shadow-[0_0_20px_-6px_rgba(232,180,90,0.4)]"
                      >
                        Open in Website History →
                      </Link>
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="ev"
                        initial={reduced ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={reduced ? { duration: 0 } : { duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <EvidencePanel
                            evidence={t.evidence}
                            source={t.source}
                            confidence={t.confidence}
                            reportContext={`${t.title} (${t.url})`}
                          />
                          {t.domain && (
                            <Link
                              href={`/entity/${t.domain}`}
                              className="mt-3 inline-block text-xs text-amber-bright hover:text-amber-bright/80 underline decoration-amber-bright/40 underline-offset-4 transition-colors"
                            >
                              Open {t.domain} in Website History →
                            </Link>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
