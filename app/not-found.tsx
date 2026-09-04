import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-3 text-mist">
        This page doesn&apos;t exist — the link may be old, or the shared
        comparison may have been removed.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-ink hover:bg-amber-bright transition-colors"
      >
        Back to the time machine
      </Link>
    </div>
  );
}
