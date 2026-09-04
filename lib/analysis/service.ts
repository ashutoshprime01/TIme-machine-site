// Snapshot analysis service — the ANALYZE stage of
// ARCHIVE → ANALYZE → VISUALIZE (plan §0, §30, §31).
//
// On-demand: fetch (throttled, cached) → hash → reuse stored analysis if the
// content hash matches, else analyze deterministically and persist with
// algorithm versions for future reprocessing (plan §69–70).

import { prisma } from "@/lib/db";
import { archive } from "@/lib/archive";
import { ArchiveError } from "@/lib/archive/types";
import { analyzeHtml } from "@/lib/analysis/engine";
import { computeDna } from "@/lib/dna/engine";
import { compareMetrics } from "@/lib/analysis/compare";
import {
  ANALYSIS_VERSION,
  DNA_VERSION,
  type AnalysisResult,
  type Capture,
  type ComparisonResult,
  type DnaProfile,
  type SnapshotMetrics,
  type TechSignal,
} from "@/lib/types";
import { logger } from "@/lib/logger";

export class AnalysisUnavailableError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string
  ) {
    super(message);
    this.name = "AnalysisUnavailableError";
  }
}

/** Ensure the Entity row exists and its capture window is up to date. */
async function ensureEntity(domain: string, capture: Capture): Promise<string> {
  const existing = await prisma.entity.findUnique({ where: { domain } });
  const entity = await prisma.entity.upsert({
    where: { domain },
    create: {
      domain,
      name: domain,
      firstCaptureAt: capture.timestamp,
      lastCaptureAt: capture.timestamp,
    },
    update: {
      firstCaptureAt: [existing?.firstCaptureAt ?? "9999", capture.timestamp].sort()[0],
      lastCaptureAt: [existing?.lastCaptureAt ?? "0", capture.timestamp].sort().reverse()[0],
    },
  });
  return entity.id;
}

async function loadStored(
  entityId: string,
  timestamp: string,
  contentHash: string
): Promise<AnalysisResult | null> {
  const stored = await prisma.snapshot.findUnique({
    where: { entityId_timestamp: { entityId, timestamp } },
    include: { analysis: { include: { dna: true } } },
  });
  const a = stored?.analysis;
  const dnaRow = a?.dna;
  if (!stored || stored.contentHash !== contentHash || !a || !dnaRow) return null;
  const metrics: SnapshotMetrics = {
    wordCount: a.wordCount,
    paragraphCount: a.paragraphCount,
    headingCount: a.headingCount,
    linkCount: a.linkCount,
    imageCount: a.imageCount,
    videoCount: a.videoCount,
    formCount: a.formCount,
    domNodes: a.domNodes,
    domDepth: a.domDepth,
    tableCount: a.tableCount,
    listCount: a.listCount,
    navRegions: a.navRegions,
    navLinks: a.navLinks,
    distinctColors: a.distinctColors,
    pageSizeBytes: a.pageSizeBytes,
    title: a.title,
    techSignals: JSON.parse(a.techSignals) as TechSignal[],
    textSignals: {
      commerce: a.textCommerce,
      social: a.textSocial,
      personal: a.textPersonal,
      ai: a.textAi,
    },
  };
  const dna: DnaProfile = {
    minimalism: dnaRow.minimalism,
    informationDensity: dnaRow.informationDensity,
    visualComplexity: dnaRow.visualComplexity,
    socialIntensity: dnaRow.socialIntensity,
    commercialization: dnaRow.commercialization,
    personalization: dnaRow.personalization,
    mobileFocus: dnaRow.mobileFocus,
    interactivity: dnaRow.interactivity,
    mediaIntensity: dnaRow.mediaIntensity,
    aiIntegration: dnaRow.aiIntegration,
    accessibilitySignals: dnaRow.accessibilitySignals,
    navigationComplexity: dnaRow.navigationComplexity,
    algorithmVersion: dnaRow.algorithmVersion,
  };
  return { metrics, dna, contentHash, algorithmVersion: a.algorithmVersion };
}

async function persist(
  entityId: string,
  capture: Capture,
  contentHash: string,
  metrics: SnapshotMetrics,
  dna: DnaProfile
) {
  const snapshot = await prisma.snapshot.upsert({
    where: { entityId_timestamp: { entityId, timestamp: capture.timestamp } },
    create: {
      entityId,
      timestamp: capture.timestamp,
      archiveUrl: archive.replayUrl(capture.original, capture.timestamp),
      originalUrl: capture.original,
      source: archive.providerName(),
      contentHash,
    },
    update: {
      contentHash,
      originalUrl: capture.original,
      archiveUrl: archive.replayUrl(capture.original, capture.timestamp),
    },
  });

  // Replace any prior analysis of this snapshot (same version → same result).
  await prisma.dna.deleteMany({ where: { analysis: { snapshotId: snapshot.id } } });
  await prisma.analysis.deleteMany({ where: { snapshotId: snapshot.id } });
  await prisma.analysis.create({
    data: {
      snapshotId: snapshot.id,
      wordCount: metrics.wordCount,
      paragraphCount: metrics.paragraphCount,
      headingCount: metrics.headingCount,
      linkCount: metrics.linkCount,
      imageCount: metrics.imageCount,
      videoCount: metrics.videoCount,
      formCount: metrics.formCount,
      domNodes: metrics.domNodes,
      domDepth: metrics.domDepth,
      tableCount: metrics.tableCount,
      listCount: metrics.listCount,
      navRegions: metrics.navRegions,
      navLinks: metrics.navLinks,
      distinctColors: metrics.distinctColors,
      pageSizeBytes: metrics.pageSizeBytes,
      title: metrics.title,
      textCommerce: metrics.textSignals.commerce,
      textSocial: metrics.textSignals.social,
      textPersonal: metrics.textSignals.personal,
      textAi: metrics.textSignals.ai,
      techSignals: JSON.stringify(metrics.techSignals),
      algorithmVersion: ANALYSIS_VERSION,
      dna: {
        create: {
          minimalism: dna.minimalism,
          informationDensity: dna.informationDensity,
          visualComplexity: dna.visualComplexity,
          socialIntensity: dna.socialIntensity,
          commercialization: dna.commercialization,
          personalization: dna.personalization,
          mobileFocus: dna.mobileFocus,
          interactivity: dna.interactivity,
          mediaIntensity: dna.mediaIntensity,
          aiIntegration: dna.aiIntegration,
          accessibilitySignals: dna.accessibilitySignals,
          navigationComplexity: dna.navigationComplexity,
          algorithmVersion: DNA_VERSION,
        },
      },
    },
  });
}

export interface SnapshotAnalysis {
  capture: Capture;
  replayUrl: string;
  analysis: AnalysisResult;
}

/**
 * Analyze one capture. Reuses the stored analysis when the archived content
 * hash is unchanged (plan §30) — re-analyzing is deterministic anyway, this
 * just avoids re-parsing megabyte pages.
 */
export async function analyzeCapture(
  domain: string,
  timestamp: string
): Promise<SnapshotAnalysis> {
  const captures = await archive.searchCaptures(domain);
  const capture =
    captures.find((c) => c.timestamp === timestamp) ??
    archive.nearestCapture(captures, timestamp);
  if (!capture) {
    throw new AnalysisUnavailableError(
      `no captures for ${domain}`,
      "We couldn't find archived captures for this website."
    );
  }

  let content;
  try {
    content = await archive.getContent(capture.original, capture.timestamp);
  } catch (err) {
    if (err instanceof ArchiveError) throw err;
    throw new AnalysisUnavailableError(
      String(err),
      "We couldn't retrieve this snapshot. Please try again in a moment."
    );
  }

  if (!/html/i.test(content.contentType)) {
    throw new AnalysisUnavailableError(
      `non-html capture ${capture.original}@${capture.timestamp} (${content.contentType})`,
      "This capture isn't an HTML page, so it can't be analyzed."
    );
  }

  const entityId = await ensureEntity(domain, capture);
  const stored = await loadStored(entityId, capture.timestamp, content.contentHash);
  if (stored) {
    return {
      capture,
      replayUrl: archive.replayUrl(capture.original, capture.timestamp),
      analysis: stored,
    };
  }

  const metrics = analyzeHtml(content.html);
  const dna = computeDna(metrics);
  await persist(entityId, capture, content.contentHash, metrics, dna);

  logger.info("analysis stored", {
    domain,
    timestamp: capture.timestamp,
    hash: content.contentHash.slice(0, 12),
  });

  return {
    capture,
    replayUrl: archive.replayUrl(capture.original, capture.timestamp),
    analysis: { metrics, dna, contentHash: content.contentHash, algorithmVersion: ANALYSIS_VERSION },
  };
}

/** Analyze two captures in parallel and diff them. */
export async function compareCaptures(
  domain: string,
  timestampA: string,
  timestampB: string
): Promise<{
  a: SnapshotAnalysis;
  b: SnapshotAnalysis;
  comparison: ComparisonResult;
}> {
  const [a, b] = await Promise.all([
    analyzeCapture(domain, timestampA),
    analyzeCapture(domain, timestampB),
  ]);
  const labelA = a.capture.timestamp.slice(0, 4);
  const labelB = b.capture.timestamp.slice(0, 4);
  return {
    a,
    b,
    comparison: compareMetrics(a.analysis.metrics, b.analysis.metrics, labelA, labelB),
  };
}
