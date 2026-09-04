"use client";

// Historical viewer frame (plan §10) — the critical security boundary.
// Archived pages are UNTRUSTED: they render inside a cross-origin iframe
// pointing at web.archive.org with a strict sandbox and NO scripting.
// Nothing from the archive ever executes in this application's origin.

import { useState } from "react";

const ZOOMS = [50, 75, 100] as const;

export function ViewerFrame({
  src,
  title,
  footer,
}: {
  src: string;
  title: string;
  footer?: React.ReactNode;
}) {
  const [zoom, setZoom] = useState<number>(75);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-faint">
          Rendered from the archive in a sandboxed frame — scripts disabled for
          security, so some interactive captures may look static.
        </p>
        <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Zoom level">
          {ZOOMS.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoom(z)}
              aria-pressed={zoom === z}
              className={`rounded-md border px-2 py-1 text-xs tabular-nums transition-colors ${
                zoom === z
                  ? "border-amber text-amber-bright bg-amber/10"
                  : "border-line text-mist hover:text-fog"
              }`}
            >
              {z}%
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-auto rounded-lg border border-line bg-[#1c1c28] max-h-[75vh]">
        <div
          style={{ width: `${1280 * (zoom / 100)}px` }}
          className="transition-[width] duration-300"
        >
          <iframe
            src={src}
            title={title}
            // Strict sandbox: no scripts, no same-origin, no popups, no forms,
            // no top navigation. Pure static rendering of archived markup.
            sandbox=""
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-[860px] w-full border-0 bg-white"
          />
        </div>
      </div>
      {footer}
    </div>
  );
}
