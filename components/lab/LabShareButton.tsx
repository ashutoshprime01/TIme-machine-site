"use client";

// Share button for Evolution Lab experiments. Same flow as comparison
// sharing: POST /api/share, copy the link to the clipboard.

import { useState } from "react";

export function LabShareButton({ domain, timestamp, mode }: { domain: string; timestamp: string; mode: string }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createShare() {
    setSharing(true);
    setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, timestampA: timestamp, timestampB: timestamp, mode }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (json.url) {
        setShareUrl(`${window.location.origin}${json.url}`);
        await navigator.clipboard?.writeText(`${window.location.origin}${json.url}`).catch(() => {});
      } else {
        setError(json.error ?? "Could not create the link.");
      }
    } catch {
      setError("Could not create the link. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {shareUrl && (
        <span className="text-xs text-mist truncate max-w-64" title={shareUrl}>
          Shareable link copied: {shareUrl}
        </span>
      )}
      {error && <span className="text-xs text-amber-bright">{error}</span>}
      <button
        type="button"
        onClick={createShare}
        disabled={sharing}
        className="rounded-lg border border-amber bg-amber/10 px-4 py-2 text-sm font-semibold text-amber-bright hover:bg-amber/20 transition-colors disabled:opacity-50"
      >
        {sharing ? "Creating…" : "Share this experiment"}
      </button>
    </div>
  );
}
