// Search pipeline (plan §8): normalize → validate → entity page.
// This page exists so search works without JavaScript (plain GET form).

import { redirect } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import Link from "next/link";
import { validateDomain } from "@/lib/security/url";

const SUGGESTIONS = ["google.com", "youtube.com", "apple.com", "wikipedia.org", "amazon.com"];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const result = validateDomain(query);

  if (result.ok && result.domain) {
    redirect(`/entity/${result.domain}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Let&apos;s try that again</h1>
      <p className="mt-3 text-mist">
        {result.error ?? "Please enter a website to search."}
      </p>
      <div className="mt-8">
        <SearchBar initialValue={query} />
      </div>
      <div className="mt-8">
        <p className="text-sm text-faint">Popular websites:</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <Link
              key={s}
              href={`/entity/${s}`}
              className="chip-poly !text-sm !normal-case !tracking-normal !px-3 !py-1.5"
            >
              {s}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
