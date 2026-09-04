"use client";

// The finale: the museum exit. Huge typography ("35 years. One
// machine."), a live UTC archive clock in mono, a pulsing
// archive-online status badge, and the magnetic CTA to 1991. The
// clock is client-only (no hydration mismatch: renders after mount).

import Link from "next/link";
import { useEffect, useState } from "react";
import { Magnetic } from "@/components/motion/Magnetic";

function ArchiveClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toISOString().slice(11, 19) // HH:MM:SS UTC
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-xs tabular-nums tracking-[0.2em] text-mist">
      {time ?? "--:--:--"} <span className="text-faint">UTC</span>
    </span>
  );
}

export function Finale() {
  return (
    <section className="relative overflow-hidden border-t border-white/5">
      <div aria-hidden="true" className="absolute inset-0 ambient-wash" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-24 pb-28 text-center">
        {/* status line */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink/60 px-3.5 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400/90" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-mist">
              Archive online
            </span>
          </span>
          <ArchiveClock />
        </div>

        {/* the enormous line */}
        <h2 className="mt-10 font-display font-bold tracking-tight leading-[0.95] text-[clamp(2.8rem,10vw,7.5rem)]">
          <span className="block text-shimmer">35 years.</span>
          <span className="block font-light italic font-serif text-fog/85">one machine.</span>
        </h2>

        <p className="mx-auto mt-8 max-w-lg text-mist">
          Every website has a past. Go find it — start with the very
          first website ever published.
        </p>

        <Magnetic className="mt-10 inline-block" strength={0.3}>
          <Link
            href="/entity/info.cern.ch"
            className="btn-primary animate-pulse-glow px-10 py-4 text-sm"
          >
            Travel to 1991 →
          </Link>
        </Magnetic>
      </div>
    </section>
  );
}
