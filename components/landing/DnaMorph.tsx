"use client";

// Internet DNA (plan §15) as a landing-page exhibit: era profiles on
// the twelve DNA dimensions that *morph* — every bar springs from its
// old value to the new one when the visitor switches years, so the
// shape of the era visibly flows. The presets are ILLUSTRATIVE era
// archetypes, clearly labeled; the real computed profile (algorithm
// v1, deterministic) is on every entity page.

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { DNA_LABELS, type DnaDimensions } from "@/lib/types";

const DIMENSIONS = Object.keys(DNA_LABELS) as Array<keyof DnaDimensions>;

type Era = { year: number; label: string; profile: DnaDimensions };

// Illustrative era archetypes for a general-purpose website — the
// shape of the web at large, not a measurement of any one domain.
const ERAS: Era[] = [
  {
    year: 1996,
    label: "The static web",
    profile: {
      minimalism: 88,
      informationDensity: 62,
      visualComplexity: 12,
      socialIntensity: 4,
      commercialization: 8,
      personalization: 2,
      mobileFocus: 0,
      interactivity: 6,
      mediaIntensity: 5,
      aiIntegration: 0,
      accessibilitySignals: 18,
      navigationComplexity: 22,
    },
  },
  {
    year: 2004,
    label: "The social web",
    profile: {
      minimalism: 48,
      informationDensity: 78,
      visualComplexity: 42,
      socialIntensity: 58,
      commercialization: 40,
      personalization: 30,
      mobileFocus: 4,
      interactivity: 48,
      mediaIntensity: 30,
      aiIntegration: 0,
      accessibilitySignals: 28,
      navigationComplexity: 55,
    },
  },
  {
    year: 2012,
    label: "The mobile web",
    profile: {
      minimalism: 55,
      informationDensity: 70,
      visualComplexity: 62,
      socialIntensity: 78,
      commercialization: 62,
      personalization: 60,
      mobileFocus: 72,
      interactivity: 66,
      mediaIntensity: 58,
      aiIntegration: 6,
      accessibilitySignals: 40,
      navigationComplexity: 60,
    },
  },
  {
    year: 2026,
    label: "The AI web",
    profile: {
      minimalism: 68,
      informationDensity: 58,
      visualComplexity: 78,
      socialIntensity: 70,
      commercialization: 82,
      personalization: 88,
      mobileFocus: 94,
      interactivity: 84,
      mediaIntensity: 86,
      aiIntegration: 74,
      accessibilitySignals: 55,
      navigationComplexity: 48,
    },
  },
];

/** One morphing bar: value springs from old to new, number counts along. */
function MorphBar({ value, dim }: { value: number; dim: keyof DnaDimensions }) {
  const reduced = useReducedMotion();
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 110, damping: 20 });
  const width = useTransform(spring, (v) => `${v}%`);
  const rounded = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    if (reduced) spring.jump(value);
    mv.set(value);
  }, [value, mv, spring, reduced]);

  return (
    <div className="grid grid-cols-[9.5rem_1fr_2.2rem] items-center gap-3">
      <dt className="truncate text-sm text-mist" title={DNA_LABELS[dim]}>
        {DNA_LABELS[dim]}
      </dt>
      <dd>
        <div className="meter-track h-2 w-full" role="img" aria-label={`${DNA_LABELS[dim]}: ${value} of 100`}>
          <motion.div
            className="meter-fill h-full"
            style={{ width, backgroundColor: "var(--color-amber)" }}
          />
        </div>
      </dd>
      <dd className="text-right tabular-nums text-sm text-fog">
        <motion.span>{rounded}</motion.span>
      </dd>
    </div>
  );
}

export function DnaMorph() {
  const [idx, setIdx] = useState(0);
  const era = ERAS[idx];

  return (
    <div>
      {/* era selector */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Era presets">
        {ERAS.map((e, i) => (
          <button
            key={e.year}
            role="tab"
            aria-selected={i === idx}
            onClick={() => setIdx(i)}
            className={`rounded-full border px-4 py-1.5 font-mono text-xs tabular-nums tracking-wide transition-all duration-300 ${
              i === idx
                ? "border-amber-bright/60 bg-amber/10 text-amber-bright shadow-[0_0_20px_-6px_rgba(232,180,90,0.5)]"
                : "border-white/10 bg-ink/50 text-faint hover:border-white/25 hover:text-mist"
            }`}
          >
            {e.year}
          </button>
        ))}
        <span className="ml-1 text-sm text-mist">{era.label}</span>
      </div>

      {/* the morphing profile — bars persist across era switches so the
          values visibly flow from old era to new */}
      <dl
        aria-label={`Illustrative Internet DNA profile, ${era.year} era`}
        className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2"
      >
        {DIMENSIONS.map((dim) => (
          <MorphBar key={dim} dim={dim} value={era.profile[dim]} />
        ))}
      </dl>

      <p className="mt-5 text-xs text-faint">
        Illustrative era archetypes, not measurements — every entity page
        computes a{" "}
        <Link href="/entity/google.com/evolution" className="underline decoration-white/20 underline-offset-2 hover:text-mist">
          real deterministic DNA profile
        </Link>{" "}
        from its archived captures.
      </p>
    </div>
  );
}
