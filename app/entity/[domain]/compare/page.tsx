// Comparison mode (plan §12): two versions, four views, shareable URL.

import Link from "next/link";
import type { Metadata } from "next";
import { validateDomain } from "@/lib/security/url";
import { CompareView } from "@/components/comparison/CompareView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain: raw } = await params;
  const domain = decodeURIComponent(raw).toLowerCase();
  return {
    title: `${domain} — compare eras`,
    description: `Compare historical versions of ${domain} side by side, with measured differences and Internet DNA.`,
    alternates: { canonical: `/entity/${domain}/compare` },
    openGraph: { title: `${domain} through time — comparison`, type: "website" },
  };
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { domain: raw } = await params;
  const { a, b } = await searchParams;
  const domain = decodeURIComponent(raw).toLowerCase();
  const validation = validateDomain(domain);

  if (!validation.ok || !validation.domain) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Not a valid website</h1>
        <p className="mt-3 text-mist">{validation.error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <header className="mb-6">
        <Link
          href={`/entity/${domain}`}
          className="text-xs text-faint hover:text-mist transition-colors"
        >
          ← {domain}
        </Link>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
          Compare eras of {domain}
        </h1>
      </header>
      <CompareView
        domain={domain}
        timestampA={(a ?? "").padEnd(14, "0").slice(0, 14)}
        timestampB={(b ?? "").padEnd(14, "0").slice(0, 14)}
      />
    </div>
  );
}
