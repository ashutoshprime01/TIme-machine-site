// Shareable comparison URLs (plan §35): /share/google-2004-vs-2026-x7k2p

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCaptureDate } from "@/lib/security/url";
import { CompareView } from "@/components/comparison/CompareView";

async function getShare(slug: string) {
  return prisma.share.findUnique({ where: { slug } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const share = await getShare(slug);
  if (!share) return { title: "Shared comparison not found" };
  const yearA = share.timestampA.slice(0, 4);
  const yearB = share.timestampB.slice(0, 4);
  const title = `${share.domain}: ${yearA} vs ${yearB}`;
  return {
    title,
    description: `A shared comparison of ${share.domain} across ${yearA} and ${yearB}, with measured changes and Internet DNA.`,
    alternates: { canonical: `/share/${slug}` },
    openGraph: {
      title: `${title} — Internet Time Machine`,
      description: `How ${share.domain} changed between ${yearA} and ${yearB}.`,
      type: "website",
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const share = await getShare(slug);
  if (!share) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <header className="mb-6">
        <p className="eyebrow eyebrow-accent">Shared comparison</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
          {share.domain}: {formatCaptureDate(share.timestampA)} vs{" "}
          {formatCaptureDate(share.timestampB)}
        </h1>
        <Link
          href={`/entity/${share.domain}`}
          className="mt-2 inline-block text-sm text-amber-bright underline underline-offset-4"
        >
          Explore more of {share.domain} →
        </Link>
      </header>
      <CompareView
        domain={share.domain}
        timestampA={share.timestampA}
        timestampB={share.timestampB}
      />
    </div>
  );
}
