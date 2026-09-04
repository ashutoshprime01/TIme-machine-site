"use client";

// Landing chapter: the Identity History introduction (master prompt:
// "Your Internet has a history too."). An interactive demo timeline —
// explicitly labeled illustrative — that shows what reconstructing a
// public presence looks like, and what the system never does.

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const DEMO_NODES = [
  { year: "2012", label: "First public trace", detail: "Earliest archived page carrying the handle" },
  { year: "2014", label: "Username appears", detail: "Public profile archived on a developer platform" },
  { year: "2016", label: "Website discovered", detail: "Personal site linked from the public profile" },
  { year: "2021", label: "New public profile", detail: "Same handle on another public platform" },
  { year: "2024", label: "Latest verified trace", detail: "Most recent public capture observed" },
];

const NEVER = [
  "No private accounts — only public pages",
  "No login bypass, ever",
  "No addresses, phones or private emails",
  "Same username ≠ same person",
];

export function IdentityIntro() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(2);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16 items-center">
      {/* demo timeline — a constellation in miniature */}
      <div className="relative">
        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-baseline justify-between gap-4">
            <p className="eyebrow !mt-0">Public identity — demo</p>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              Illustrative
            </span>
          </div>

          {/* the spine */}
          <div className="relative mt-8 mb-2 h-px bg-white/10" aria-hidden="true">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-bright/70 to-amber-bright/30"
              initial={reduced ? false : { width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={reduced ? { duration: 0 } : { duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <ol className="relative flex justify-between">
            {DEMO_NODES.map((n, i) => {
              const isActive = i === active;
              return (
                <li key={n.year} className="relative flex-1">
                  <button
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-label={`${n.year}: ${n.label}`}
                    className="group relative mx-auto flex h-10 w-10 items-center justify-center"
                  >
                    {/* node glow */}
                    <span
                      aria-hidden="true"
                      className={`absolute h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                        isActive
                          ? "bg-amber-bright shadow-[0_0_18px_2px_rgba(232,180,90,0.55)] scale-125"
                          : i < active
                            ? "bg-amber-bright/50"
                            : "bg-white/25 group-hover:bg-white/45"
                      }`}
                    />
                    <span className="sr-only">{n.label}</span>
                  </button>
                  <p
                    className={`mt-1 text-center font-mono text-[10px] sm:text-[11px] tabular-nums tracking-wide transition-colors ${
                      isActive ? "text-amber-bright" : "text-faint"
                    }`}
                  >
                    {n.year}
                  </p>
                </li>
              );
            })}
          </ol>

          {/* active node detail */}
          <div className="mt-6 min-h-[76px] rounded-xl border border-white/8 bg-ink/50 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
              {DEMO_NODES[active].year} — trace
            </p>
            <p className="mt-1.5 text-sm font-semibold text-fog">{DEMO_NODES[active].label}</p>
            <p className="mt-1 text-xs text-mist">{DEMO_NODES[active].detail}</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              Source · Confidence · Evidence — inspectable on every node
            </p>
          </div>
        </div>
      </div>

      {/* the pitch + the limits */}
      <div>
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
          Your Internet has{" "}
          <span className="font-light italic font-serif text-fog/80">a history too.</span>
        </h3>
        <p className="mt-4 text-mist leading-relaxed">
          Enter a name, a handle, a public alias or a domain — and reconstruct the
          timeline of <em className="text-fog not-italic">publicly discoverable</em> traces
          behind it. Archived profile pages, linked websites, usernames through the
          years. Every discovery carries its source, its date and its confidence —
          nothing is guessed, nothing is invented.
        </p>

        <ul className="mt-6 space-y-2.5">
          {NEVER.map((n) => (
            <li key={n} className="flex items-start gap-3 text-sm text-mist">
              <span
                aria-hidden="true"
                className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-bright/90"
              >
                never
              </span>
              {n}
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Link
            href="/identity/torvalds"
            className="btn-primary font-mono text-xs uppercase tracking-[0.18em]"
          >
            Reconstruct a real public identity →
          </Link>
        </div>
      </div>
    </div>
  );
}
