"use client";

// Destination cards (plan §7 actions): magnetic hover with 3D
// perspective tilt that follows the cursor, a border that expands
// (amber light crawling in from the cursor's corner), and an animated
// wireframe preview that starts drawing when the card is engaged.
// Desktop-only effects; touch and reduced-motion get clean static
// cards with the standard card-hover treatment.

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

const ACTIONS = [
  {
    num: "01",
    title: "Explore History",
    description:
      "Pick a website, pick a year, and see the real archived page — from the 1990s to today.",
    href: `/entity/google.com`,
    cta: "See Google through time",
    preview: "old" as const,
  },
  {
    num: "02",
    title: "Compare Eras",
    description:
      "Put two eras side by side, wipe between them with a slider, and get a shareable link.",
    href: `/entity/youtube.com/compare`,
    cta: "Compare YouTube eras",
    preview: "split" as const,
  },
  {
    num: "03",
    title: "Measure Evolution",
    description:
      "Internet DNA, detected change events, cross-year charts — every claim deterministic and labeled.",
    href: `/entity/apple.com/evolution`,
    cta: "Run an evolution report",
    preview: "chart" as const,
  },
  {
    num: "04",
    title: "Hypothesize",
    description:
      "Run deterministic what-if transformations in the Evolution Lab, or extrapolate measured trends to 2040.",
    href: `/entity/wikipedia.org/lab`,
    cta: "Open the Evolution Lab",
    preview: "lab" as const,
  },
];

const TILT = 7; // max degrees

function DestinationCard({ a, i }: { a: (typeof ACTIONS)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [hover, setHover] = useState(false);

  // raw pointer offsets (px from card center, normalized -1..1)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-1, 1], [-TILT, TILT]), {
    stiffness: 180,
    damping: 20,
  });
  const rotateX = useSpring(useTransform(my, [-1, 1], [TILT, -TILT]), {
    stiffness: 180,
    damping: 20,
  });

  // border light follows the cursor position
  const [glow, setGlow] = useState({ x: 50, y: 0 });

  function onPointerMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width; // 0..1
    const ny = (e.clientY - rect.top) / rect.height;
    mx.set((nx - 0.5) * 2);
    my.set((ny - 0.5) * 2);
    setGlow({ x: nx * 100, y: ny * 100 });
  }

  function reset() {
    mx.set(0);
    my.set(0);
    setHover(false);
  }

  const interactive = !reduced;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 30, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: "spring", stiffness: 90, damping: 20, delay: i * 0.08 }}
      style={
        interactive
          ? { rotateX, rotateY, transformPerspective: 900 }
          : undefined
      }
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerEnter={interactive ? () => setHover(true) : undefined}
      onPointerLeave={interactive ? reset : undefined}
      className="[perspective:900px]"
    >
      <Link
        href={a.href}
        className="group relative block rounded-xl glass overflow-hidden card-hover"
      >
        {/* expanding border: amber light that grows from the cursor's
            position while engaged, fading on leave */}
        {interactive && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
            style={{
              opacity: hover ? 1 : 0,
              background: `radial-gradient(240px circle at ${glow.x}% ${glow.y}%, rgba(232,180,90,0.14), transparent 65%)`,
            }}
          />
        )}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-xl border border-amber-bright/0 transition-all duration-500 ${
            hover ? "border-amber-bright/30" : ""
          }`}
        />

        <div className="relative p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <span className="font-mono text-xs tabular-nums text-faint tracking-[0.2em]">
              {a.num}
            </span>
            <Preview kind={a.preview} active={hover} reduced={!!reduced} />
          </div>
          <h3 className="mt-4 font-semibold text-xl group-hover:text-amber-bright transition-colors">
            {a.title}
          </h3>
          <p className="mt-2 text-sm text-mist leading-relaxed">{a.description}</p>
          <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-amber-bright">
            {a.cta}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/** Animated wireframe previews — draw themselves when the card is engaged. */
function Preview({
  kind,
  active,
  reduced,
}: {
  kind: "old" | "split" | "chart" | "lab";
  active: boolean;
  reduced: boolean;
}) {
  const draw = active && !reduced;
  const bar = (w: string, i: number) => (
    <motion.div
      key={i}
      className="h-[3px] rounded-sm bg-white/15"
      style={{ width: w, originX: 0 }}
      animate={{ scaleX: draw ? 1 : 0.35, opacity: draw ? 1 : 0.45 }}
      transition={{ delay: draw ? 0.05 * i : 0, type: "spring", stiffness: 200, damping: 22 }}
    />
  );

  return (
    <span
      aria-hidden="true"
      className="hidden sm:flex h-14 w-20 shrink-0 flex-col justify-center gap-1 rounded-md border border-white/10 bg-white/[0.03] p-2"
    >
      {kind === "old" && (
        <>
          <span className="h-1.5 w-1/2 rounded-sm bg-amber-bright/40" />
          {bar("90%", 0)}
          {bar("70%", 1)}
          {bar("84%", 2)}
        </>
      )}
      {kind === "split" && (
        <span className="flex h-full items-stretch gap-1">
          <span className="flex-1 flex flex-col justify-center gap-1">
            {bar("100%", 0)}
            {bar("60%", 1)}
          </span>
          <span className="w-px bg-amber-bright/50" />
          <span className="flex-1 rounded-sm bg-gradient-to-br from-ice/25 to-transparent" />
        </span>
      )}
      {kind === "chart" && (
        <span className="flex h-full items-end gap-1">
          {[0.3, 0.5, 0.4, 0.7, 0.6, 0.95].map((h, i) => (
            <motion.span
              key={i}
              className="flex-1 rounded-sm bg-ice/50"
              animate={{ height: draw ? `${h * 100}%` : `${h * 45}%` }}
              transition={{ delay: draw ? 0.05 * i : 0, type: "spring", stiffness: 200, damping: 20 }}
            />
          ))}
        </span>
      )}
      {kind === "lab" && (
        <>
          <span className="flex justify-between font-mono text-[8px] text-faint">
            <span>1998</span>
            <span className="text-amber-bright">?</span>
          </span>
          <motion.span
            className="mx-auto h-5 w-5 rounded-full border border-amber-bright/60"
            animate={draw ? { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] } : { scale: 1, opacity: 0.6 }}
            transition={draw ? { repeat: Infinity, duration: 1.6 } : {}}
          />
          {bar("80%", 3)}
        </>
      )}
    </span>
  );
}

export function DestinationCards() {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2">
      {ACTIONS.map((a, i) => (
        <DestinationCard key={a.num} a={a} i={i} />
      ))}
    </div>
  );
}
