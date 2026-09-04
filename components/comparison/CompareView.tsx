// Server-side comparison renderer: load captures, run the deterministic
// analysis, and hand the result to the interactive CompareTool.

import { Suspense } from "react";
import { archive } from "@/lib/archive";
import { compareCaptures, AnalysisUnavailableError } from "@/lib/analysis/service";
import { ArchiveError } from "@/lib/archive/types";
import { isCdxTimestamp } from "@/lib/security/url";
import { CompareTool, type CompareData } from "@/components/comparison/CompareTool";

function friendlyError(err: unknown): string {
  if (err instanceof AnalysisUnavailableError || err instanceof ArchiveError) {
    return err.userMessage;
  }
  return "We couldn't retrieve these snapshots. Please try again in a moment.";
}

async function Loaded({
  domain,
  timestampA,
  timestampB,
}: {
  domain: string;
  timestampA: string;
  timestampB: string;
}) {
  const captures = await archive.searchCaptures(domain);
  if (captures.length < 2) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <h2 className="text-lg font-semibold">Not enough captures to compare</h2>
        <p className="mt-2 text-sm text-mist">
          We need at least two archived captures of {domain}.
        </p>
      </div>
    );
  }

  const first = captures[0].timestamp;
  const latest = captures[captures.length - 1].timestamp;
  const tsA = isCdxTimestamp(timestampA) ? timestampA : first;
  const tsB = isCdxTimestamp(timestampB) ? timestampB : latest;

  let result;
  try {
    result = await compareCaptures(domain, tsA, tsB);
  } catch (err) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <h2 className="text-lg font-semibold">Comparison unavailable</h2>
        <p className="mt-2 text-sm text-mist">{friendlyError(err)}</p>
      </div>
    );
  }

  const data: CompareData = {
    captureA: result.a.capture,
    captureB: result.b.capture,
    replayA: result.a.replayUrl,
    replayB: result.b.replayUrl,
    metricsA: result.a.analysis.metrics,
    metricsB: result.b.analysis.metrics,
    dnaA: result.a.analysis.dna,
    dnaB: result.b.analysis.dna,
    comparison: result.comparison,
  };

  return (
    <CompareTool
      domain={domain}
      captures={captures}
      initialA={tsA}
      initialB={tsB}
      data={data}
    />
  );
}

function CompareSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <p className="text-sm text-mist">Comparing structures… calculating Internet DNA…</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 glass rounded-lg animate-pulse-soft" />
        <div className="h-72 glass rounded-lg animate-pulse-soft" />
      </div>
    </div>
  );
}

export function CompareView({
  domain,
  timestampA,
  timestampB,
}: {
  domain: string;
  timestampA: string;
  timestampB: string;
}) {
  return (
    <Suspense key={`${domain}-${timestampA}-${timestampB}`} fallback={<CompareSkeleton />}>
      <Loaded domain={domain} timestampA={timestampA} timestampB={timestampB} />
    </Suspense>
  );
}
