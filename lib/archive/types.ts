// Archive provider abstraction (plan §29).
// The app never talks to a concrete archive from UI code — only through
// this interface, so providers can be added, removed or reordered freely.

import type { Capture } from "@/lib/types";

export interface ArchiveContent {
  html: string;
  contentType: string;
  /** SHA-256 of the retrieved payload. */
  contentHash: string;
  /** The capture Wayback actually served (it redirects to nearest). */
  resolvedTimestamp: string;
}

export interface ArchiveProvider {
  readonly name: string;
  /** List archived captures of a domain's homepage, oldest → newest. */
  searchCaptures(domain: string): Promise<Capture[]>;
  /** Same search, reporting whether the result is complete or partial. */
  searchCapturesWithMeta(domain: string): Promise<{ captures: Capture[]; complete: boolean }>;
  /** Fetch the original (unrewritten) HTML of a capture. */
  getContent(originalUrl: string, timestamp: string): Promise<ArchiveContent>;
  /** Human-facing replay URL for a capture (used in iframes / source links). */
  replayUrl(originalUrl: string, timestamp: string): string;
}

export class ArchiveError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ArchiveError";
  }
}
