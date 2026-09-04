"use client";

// The manifesto: one paragraph that lights up word by word as you
// scroll through it — dim to bright, sequential, like a documentary
// voiceover. Each word is its own component so each gets its own
// scroll-linked transform (the hooks rule). One per page; reduced
// motion gets the fully-lit paragraph.

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";

const TEXT =
  "Every website is a living record. It was born, it changed, it grew up with the world around it — and most of its past is still out there, waiting in public archives. Not guesses. Not reconstructions. The actual pages, timestamped and preserved. We built the machine that lets you walk through them.";

function Word({
  word,
  index,
  total,
  progress,
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(progress, [start, end], [0.16, 1]);
  const color = useTransform(progress, [start, end], ["#6c6c86", "#f4f4fa"]);
  return (
    <motion.span style={{ opacity, color }} className="inline-block">
      {word}&nbsp;
    </motion.span>
  );
}

export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.45"],
  });

  const words = TEXT.split(" ");

  return (
    <p
      ref={ref}
      className="max-w-3xl text-2xl sm:text-3xl lg:text-4xl font-light leading-snug tracking-tight"
      aria-label={TEXT}
    >
      {words.map((word, i) =>
        reduced ? (
          <span key={i} className="inline-block">
            {word}&nbsp;
          </span>
        ) : (
          <Word key={i} word={word} index={i} total={words.length} progress={scrollYProgress} />
        )
      )}
    </p>
  );
}
