"use client";

// Friendly errors only (plan §63) — details go to developer logs.

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-mist">
        We couldn&apos;t complete that request. Possible reasons: the archive
        provider is temporarily unavailable, or the snapshot could not be
        retrieved.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-ink hover:bg-amber-bright transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
