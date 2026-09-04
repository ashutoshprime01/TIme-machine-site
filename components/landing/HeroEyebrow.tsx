"use client";

// Hero eyebrow with modem decode: on a first-visit boot the decode
// waits for the boot overlay's blinds to wipe; within an already
// booted session it starts almost immediately. The delay is chosen
// client-side after mount (no SSR markup difference — it only times
// the animation).

import { useEffect, useState } from "react";
import { ScrambleText } from "@/components/atmosphere/ScrambleText";

const TEXT = "Street View for the Internet";

export function HeroEyebrow() {
  const [delay, setDelay] = useState(1.9);

  useEffect(() => {
    if (sessionStorage.getItem("itm-booted") === "1") setDelay(0.35);
  }, []);

  return (
    <p className="animate-fade-up eyebrow eyebrow-accent">
      <ScrambleText text={TEXT} duration={1.1} delay={delay} immediate />
    </p>
  );
}
