"use client";

// The Principle (plan §0): Archive → Analyze → Visualize → Evolve.
// Each stage rises into place as it scrolls into view, and the arrow
// between stages physically draws itself (an SVG path animating
// pathLength 0 → 1) before the next stage mounts. On mobile the row
// becomes a column and the arrows draw downward.

import { motion, useReducedMotion, type Variants } from "framer-motion";

const STAGES = [
  {
    step: "01",
    title: "Archive",
    text: "Public web archives hold decades of captures. We fetch only what you ask for.",
  },
  {
    step: "02",
    title: "Analyze",
    text: "Deterministic HTML analysis counts words, links, images, structure and technology signals.",
  },
  {
    step: "03",
    title: "Visualize",
    text: "Timelines, side-by-side comparisons, sliders and change meters make evolution visible.",
  },
  {
    step: "04",
    title: "Evolve",
    text: "Internet DNA profiles quantify each era. Deeper evolution tools grow from this evidence.",
  },
];

const stageVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 110, damping: 20, delay: i * 0.55 },
  }),
};

const arrowVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0.4 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { type: "spring", stiffness: 55, damping: 18, delay: 0.4 + i * 0.55 },
      opacity: { delay: 0.4 + i * 0.55 },
    },
  }),
};

/** Horizontal arrow: draws left→right with a nub head. */
function ArrowSvg({ i }: { i: number }) {
  return (
    <motion.svg
      viewBox="0 0 64 24"
      fill="none"
      className="hidden shrink-0 w-16 h-6 self-center lg:block"
      aria-hidden="true"
      variants={arrowVariants}
      custom={i}
    >
      <motion.path
        d="M2 12 H50"
        stroke="var(--color-amber-bright)"
        strokeWidth="1.5"
        strokeLinecap="round"
        variants={arrowVariants}
        custom={i}
      />
      <motion.path
        d="M50 12 L56 8 M50 12 L56 16"
        stroke="var(--color-amber-bright)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={arrowVariants}
        custom={i}
      />
    </motion.svg>
  );
}

/** Vertical arrow for the mobile column. */
function ArrowSvgDown({ i }: { i: number }) {
  return (
    <motion.svg
      viewBox="0 0 24 48"
      fill="none"
      className="shrink-0 w-6 h-12 self-start lg:hidden"
      aria-hidden="true"
      variants={arrowVariants}
      custom={i}
    >
      <motion.path
        d="M12 2 V36"
        stroke="var(--color-amber-bright)"
        strokeWidth="1.5"
        strokeLinecap="round"
        variants={arrowVariants}
        custom={i}
      />
      <motion.path
        d="M12 36 L8 42 M12 36 L16 42"
        stroke="var(--color-amber-bright)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={arrowVariants}
        custom={i}
      />
    </motion.svg>
  );
}

export function Pipeline() {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((s) => (
          <li key={s.step} className="glass rounded-xl p-5">
            <div className="font-mono text-xs font-semibold tabular-nums text-amber-bright tracking-[0.2em]">{s.step}</div>
            <h3 className="mt-3 font-semibold text-lg">{s.title}</h3>
            <p className="mt-2 text-sm text-mist leading-relaxed">{s.text}</p>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <motion.ol
      className="mt-10 flex flex-col lg:flex-row lg:gap-0"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {STAGES.map((s, i) => (
        <li key={s.step} className="contents">
          <motion.div
            className="glass rounded-xl p-5 card-hover lg:flex-1"
            variants={stageVariants}
            custom={i}
          >
            <div className="font-mono text-xs font-semibold tabular-nums text-amber-bright tracking-[0.2em]">
              {s.step}
            </div>
            <h3 className="mt-3 font-semibold text-lg">{s.title}</h3>
            <p className="mt-2 text-sm text-mist leading-relaxed">{s.text}</p>
          </motion.div>
          {i < STAGES.length - 1 && (
            <>
              <ArrowSvg i={i} />
              <ArrowSvgDown i={i} />
            </>
          )}
        </li>
      ))}
    </motion.ol>
  );
}
