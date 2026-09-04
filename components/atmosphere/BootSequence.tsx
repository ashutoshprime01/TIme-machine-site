"use client";

// Boot sequence: the power-on moment. A dark screen with mono archive
// log lines and a 0→100 counter, then the whole overlay wipes away in
// five vertical bands (venetian blinds) to reveal the hero. Shown once
// per session (sessionStorage), skippable by click or key, and skipped
// entirely for reduced-motion or repeat visits within the session.

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const LOG_LINES = [
  "INTERNET TIME MACHINE — ARCHIVE TERMINAL",
  "INDEXING 35 YEARS OF CAPTURES",
  "CDX TIMELINE ............ OK",
  "DETERMINISTIC ANALYZER .. OK",
  "DNA PROFILER ............ OK",
  "TIMESTAMP LOCK ACQUIRED",
];

const BOOT_MS = 1700;

export function BootSequence() {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<"hidden" | "boot" | "done">("hidden");

  useEffect(() => {
    // repeat visits in the same session skip straight through
    if (sessionStorage.getItem("itm-booted") === "1") return;
    if (reduced === null) return; // still measuring — wait a tick
    if (reduced) {
      sessionStorage.setItem("itm-booted", "1");
      return;
    }
    sessionStorage.setItem("itm-booted", "1");
    setPhase("boot");
    const t = setTimeout(() => setPhase("done"), BOOT_MS);
    return () => clearTimeout(t);
  }, [reduced]);

  // log lines revealed over the boot window
  const [lineCount, setLineCount] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (phase !== "boot") return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (BOOT_MS - 250));
      setCount(Math.round(t * 100));
      setLineCount(Math.min(LOG_LINES.length, Math.floor(t * (LOG_LINES.length + 1))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  function skip() {
    setPhase("done");
  }

  return (
    <AnimatePresence>
      {phase === "boot" && (
        <motion.div
          className="fixed inset-0 z-[90] flex flex-col bg-ink"
          exit={{ transition: { duration: 0.6 } }}
          onPointerDown={skip}
          onKeyDown={skip}
          role="presentation"
        >
          {/* five vertical bands wipe up in sequence — nothing is a
              plain fade */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute top-0 h-full bg-ink"
              style={{ left: `${i * 20}%`, width: "20.5%" }}
              exit={{ y: "-100%" }}
              transition={{
                duration: 0.55,
                delay: 0.02 * (2 - Math.abs(i - 2)), // center bands lead
                ease: [0.76, 0, 0.24, 1],
              }}
            />
          ))}

          <motion.div
            className="relative z-10 m-auto w-full max-w-md px-6 font-mono"
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-1.5 text-[11px] leading-relaxed text-faint">
              {LOG_LINES.slice(0, lineCount).map((line, i) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={i === 0 ? "text-amber-bright tracking-[0.2em]" : "tracking-wider"}
                >
                  {i === 0 ? line : `> ${line}`}
                </motion.p>
              ))}
            </div>
            <div className="mt-8 flex items-end justify-between">
              <span className="text-5xl font-light tabular-nums text-fog">
                {String(count).padStart(3, "0")}
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-faint">
                click to skip
              </span>
            </div>
            <div className="mt-3 h-px w-full bg-line">
              <motion.div
                className="h-full bg-amber-bright"
                style={{ width: `${count}%` }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
