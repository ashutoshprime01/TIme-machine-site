"use client";

// Shared OS state: the scrub year, which HUD panels are mounted, and
// which drawer (Lab / Compare) is open. Everything reads from here so
// the 3D camera, the scrubber and the panels stay in sync without
// prop drilling through the canvas.

import { create } from "zustand";

export type DrawerId = "lab" | "compare";

interface OsState {
  /** Year currently scrubbed to (null = free camera, no scrub). */
  year: number | null;
  /** Camera target the rig lerps toward (timeline-space x). */
  setYear: (year: number | null) => void;

  /** Which capture year actually have data (drives particle glow). */
  years: number[];
  setYears: (years: number[]) => void;

  drawer: DrawerId | null;
  setDrawer: (id: DrawerId | null) => void;
  toggleDrawer: (id: DrawerId) => void;
}

export const useOs = create<OsState>((set) => ({
  year: null,
  setYear: (year) => set({ year }),
  years: [],
  setYears: (years) => set({ years }),

  drawer: null,
  setDrawer: (id) => set({ drawer: id }),
  toggleDrawer: (id) =>
    set((s) => ({ drawer: s.drawer === id ? null : id })),
}));
