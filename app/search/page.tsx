// Search pipeline (plan §8 + ITM 2.0): normalize → classify → dispatch.
// Domain-shaped input routes to WEB HISTORY (/entity); handles, names and
// bare usernames route to IDENTITY HISTORY (/identity). This page exists so
// search works without JavaScript (plain GET form).

import { redirect } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import Link from "next/link";
import { validateDomain } from "@/lib/security/url";
import { classifyIdentityQuery } from "@/lib/identity/normalize";

const WEB_SUGGESTIONS = ["google.com", "youtube.com", "apple.com", "wikipedia.org", "amazon.com"];
const IDENTITY_SUGGESTIONS = ["@torvalds", "@sindresorhus", "@gaearon"];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const domainResult = validateDomain(query);
  const identityQuery = classifyIdentityQuery(query);

  // A dotted, domain-valid input is a website search.
  if (domainResult.ok && domainResult.domain && identityQuery.kind === "domain") {
    redirect(`/entity/${domainResult.domain}`);
  }

  // Anything handle-, name- or username-shaped is an identity search.
  if (!identityQuery.error && identityQuery.key) {
    redirect(`/identity/${encodeURIComponent(identityQuery.key)}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Let&apos;s try that again</h1>
      <p className="mt-3 text-mist">
        {identityQuery.error ?? domainResult.error ?? "Please enter something to search."}
      </p>
      <div className="mt-8">
        <SearchBar initialValue={query} />
      </div>
      <div className="mt-8">
        <p className="text-sm text-faint">Popular websites:</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {WEB_SUGGESTIONS.map((s) => (
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
      <div className="mt-6">
        <p className="text-sm text-faint">Or reconstruct a public identity:</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {IDENTITY_SUGGESTIONS.map((s) => (
            <Link
              key={s}
              href={`/identity/${s.replace(/^@/, "")}`}
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
