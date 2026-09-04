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
