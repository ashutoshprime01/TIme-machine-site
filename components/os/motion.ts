"use client";

// Shared motion helpers: one place for the reduced-motion check so
// spring entries collapse to instant mounts when the user has
// requested less motion.

export function reduceMotionPreference(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
