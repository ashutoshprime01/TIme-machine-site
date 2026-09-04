"use client";

// Off-canvas tactical drawers: Evolution Lab and Compare slide in from
// the right as frosted sheets OVER the 3D canvas (which stays visible
// through the 72% transparent glass). Framer Motion springs the x
// translate; the launchpad toggles live in the OS status bar.

import { AnimatePresence, motion } from "framer-motion";
import { useOs, type DrawerId } from "@/lib/os/store";
import { reduceMotionPreference } from "./motion";

const SPRING = { type: "spring", stiffness: 300, damping: 34, mass: 1 } as const;

function DrawerShell({
  id,
  label,
  epistemic,
  children,
}: {
  id: DrawerId;
  label: string;
  epistemic: "fact" | "hypothesis";
  children: React.ReactNode;
}) {
  const drawer = useOs((s) => s.drawer);
  const setDrawer = useOs((s) => s.setDrawer);
  const reduced = reduceMotionPreference();
  const open = drawer === id;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* scrim: click to close — transparent so the canvas shows */}
          <motion.button
            key={`${id}-scrim`}
            aria-label={`Close ${label}`}
            className="fixed inset-0 z-40 cursor-default bg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawer(null)}
          />
          <motion.aside
            key={id}
            role="dialog"
            aria-label={label}
            className="hud-drawer fixed right-0 top-0 z-50 h-full w-[min(560px,100vw)] overflow-y-auto rounded-l-xl"
            initial={reduced ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduced ? { opacity: 0 } : { x: "100%" }}
            transition={SPRING}
            drag={reduced ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.x > 120) setDrawer(null);
            }}
          >
            <div className="hud-title sticky top-0 z-10 bg-transparent backdrop-blur-xl border-b border-white/10">
              <span className={`hud-dot ${epistemic === "fact" ? "hud-dot-fact" : "hud-dot-hypothesis"}`} />
              <span>{label}</span>
              <button
                type="button"
                onClick={() => setDrawer(null)}
                className="ml-auto font-mono text-xs text-faint hover:text-fog transition-colors px-1"
                aria-label={`Close ${label}`}
              >
                ✕
              </button>
            </div>
            <div className="p-5 pb-16">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function OsDrawers({ children }: { children: React.ReactNode }) {
  // children: [labContent, compareContent] in that order
  const [lab, compare] = Array.isArray(children) ? children : [null, null];
  return (
    <>
      <DrawerShell id="lab" label="Evolution Lab" epistemic="hypothesis">
        {lab}
      </DrawerShell>
      <DrawerShell id="compare" label="Compare Mode" epistemic="fact">
        {compare}
      </DrawerShell>
    </>
  );
}
