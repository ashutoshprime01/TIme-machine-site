"use client";

// Modem decode: text resolves from a scramble of terminal characters
// — like a dial-up connection locking in. Runs once when the element
// enters the viewport (or on mount with `immediate`). Reduced-motion
// and SSR-first paint get the plain string.

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

const CHARSET = "!<>-_\\/[]{}—=+*^?#·";

export function ScrambleText({
  text,
  className = "",
  /** seconds from first garbage frame to fully resolved */
  duration = 0.9,
  delay = 0,
  immediate = false,
}: {
  text: string;
  className?: string;
  duration?: number;
  delay?: number;
  immediate?: boolean;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(text);

  const started = immediate || inView;

  useEffect(() => {
    if (reduced || !started) return;
    let raf = 0;
    let cancelled = false;
    const start = performance.now() + delay * 1000;

    const frame = (now: number) => {
      if (cancelled) return;
      const t = Math.min(1, Math.max(0, (now - start) / (duration * 1000)));
      if (t <= 0) {
        // still waiting out the delay — full scramble
        setDisplay(text.replace(/[^\s]/g, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]));
        raf = requestAnimationFrame(frame);
        return;
      }
      const eased = 1 - Math.pow(1 - t, 2);
      const resolved = Math.floor(eased * text.length);
      let out = text.slice(0, resolved);
      for (let i = resolved; i < text.length; i++) {
        out += /\s/.test(text[i])
          ? text[i]
          : CHARSET[Math.floor(Math.random() * CHARSET.length)];
      }
      setDisplay(out);
      if (t < 1) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [started, text, duration, delay, reduced]);

  // the scrambled string keeps the final text's length (whitespace is
  // preserved), so the layout never shifts during the decode
  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
