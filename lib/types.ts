// Shared domain types — the contract between archive, analysis and UI layers.

export interface Capture {
  /** CDX timestamp, YYYYMMDDhhmmss (UTC) */
  timestamp: string;
  /** Original captured URL, e.g. "http://google.com/" */
  original: string;
  digest: string;
  statusCode: number;
}

export interface TechSignal {
  name: string;
  category:
    | "html"
    | "css"
    | "javascript"
    | "framework"
    | "analytics"
    | "advertising"
    | "fonts"
    | "media"
    | "social"
    | "layout";
  confidence: "high" | "medium" | "low";
  evidence: string;
}

export interface SnapshotMetrics {
  // content
  wordCount: number;
  paragraphCount: number;
  headingCount: number;
  linkCount: number;
  imageCount: number;
  videoCount: number;
  formCount: number;
  // structure
  domNodes: number;
  domDepth: number;
  tableCount: number;
  listCount: number;
  navRegions: number;
  navLinks: number;
  // design
  distinctColors: number;
  pageSizeBytes: number;
  title: string | null;
  techSignals: TechSignal[];
  // text signal hits (plan §16: e.g. purchase buttons, pricing, share, sign-in)
  textSignals: {
    commerce: number;
    social: number;
    personal: number;
    ai: number;
  };
}

export type DnaDimensions = {
  minimalism: number;
  informationDensity: number;
  visualComplexity: number;
  socialIntensity: number;
  commercialization: number;
  personalization: number;
  mobileFocus: number;
  interactivity: number;
  mediaIntensity: number;
  aiIntegration: number;
  accessibilitySignals: number;
  navigationComplexity: number;
};

export interface DnaProfile extends DnaDimensions {
  algorithmVersion: string;
}

export interface AnalysisResult {
  metrics: SnapshotMetrics;
  dna: DnaProfile;
  contentHash: string;
  algorithmVersion: string;
}

/** Knowledge status labels — plan §2: never mix fact with speculation. */
export type KnowledgeStatus = "FACT" | "INFERENCE" | "HYPOTHESIS";

export interface DetectedChange {
  status: "FACT" | "INFERENCE";
  text: string;
}

export interface ComparisonResult {
  contentChange: number;
  structureChange: number;
  navigationChange: number;
  technologyChange: number;
  evolutionIndex: number;
  detectedChanges: DetectedChange[];
}

export const DNA_LABELS: Record<keyof DnaDimensions, string> = {
  minimalism: "Minimalism",
  informationDensity: "Information Density",
  visualComplexity: "Visual Complexity",
  socialIntensity: "Social Intensity",
  commercialization: "Commercialization",
  personalization: "Personalization",
  mobileFocus: "Mobile Focus",
  interactivity: "Interactivity",
  mediaIntensity: "Media Intensity",
  aiIntegration: "AI Integration",
  accessibilitySignals: "Accessibility Signals",
  navigationComplexity: "Navigation Complexity",
};

export const DNA_VERSION = "1.0";
export const ANALYSIS_VERSION = "1.0";

// ─────────────────────────────────────────────────────────────────────────────
// Identity History (ITM 2.0) — public-web archaeology types.
// A trace is one publicly discoverable artifact; an identity is a *candidate
// group* of traces, never an asserted person.
// ─────────────────────────────────────────────────────────────────────────────

/** Categories of public traces (master prompt timeline categories). */
export type IdentityTraceType =
  | "PROFILE"
  | "WEBSITE"
  | "DOMAIN"
  | "MENTION"
  | "PROJECT"
  | "POST"
  | "IMAGE"
  | "USERNAME";

/** Epistemic confidence for every identity claim. UNVERIFIED = no evidence. */
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | "UNVERIFIED";

/** What the evidence actually is — inspectable by the user. */
export interface EvidenceBundle {
  /** Short label, e.g. "USERNAME MATCH" or "ARCHIVED PROFILE PAGE". */
  label: string;
  /** Human sentence describing what was directly observed. */
  reason: string;
  /** Public URL where the evidence can be inspected. */
  url: string;
  /** When the evidence was observed / the page was captured (ISO-ish or CDX). */
  date: string;
  /** Named scoring signals that fired, e.g. "exact-username-match +2". */
  signals: string[];
}

/** One grouped public trace as delivered to the UI. */
export interface IdentityTraceItem {
  id: string;
  type: IdentityTraceType;
  title: string;
  url: string;
  /** Live public URL when one exists (else the replay URL). */
  liveUrl?: string;
  source: string;
  /** CDX timestamp YYYYMMDDhhmmss */
  observedAt: string;
  confidence: ConfidenceLevel;
  evidence: EvidenceBundle;
  /** Domain this trace connects to, for Website History cross-links. */
  domain?: string;
}

/** Confidence evaluation with inspectable methodology. */
export interface ConfidenceAssessment {
  score: number;
  level: ConfidenceLevel;
  /** Each signal that fired, with its weight — shown to users. */
  breakdown: { signal: string; weight: number }[];
}

/** Full result of an identity search, ready for the UI. */
export interface IdentityReport {
  key: string;
  displayName: string;
  kind: "username" | "name" | "domain";
  /** What the user originally typed. */
  query: string;
  firstObservedAt: string | null;
  lastObservedAt: string | null;
  traces: IdentityTraceItem[];
  aliases: {
    alias: string;
    type: "username" | "name" | "domain";
    firstSeen: string | null;
    lastSeen: string | null;
    source: string;
    confidence: ConfidenceLevel;
  }[];
  /** Cross-trace relationships (evidence-backed links, never identity claims). */
  relationships: {
    sourceTitle: string;
    targetTitle: string;
    type: string;
    confidence: ConfidenceLevel;
    reason: string;
  }[];
  confidence: ConfidenceAssessment;
  /** Sources that were queried but returned nothing (honesty). */
  sourcesQueried: string[];
}

export const IDENTITY_CONFIDENCE_VERSION = "1.0";
