import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateDomain, isCdxTimestamp } from "@/lib/security/url";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getLabMode } from "@/lib/lab/engine";
import { logger } from "@/lib/logger";

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

function slugify(domain: string, tsA: string, tsB: string): string {
  const label = domain.replace(/\.(com|org|net|io|co|edu|gov)(\.[a-z]{2})?$/i, "");
  const slug = `${label}-${tsA.slice(0, 4)}-vs-${tsB.slice(0, 4)}-${randomSuffix()}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");
  return slug;
}

export async function POST(request: Request) {
  const limiter = rateLimit(`share:${clientIp(request.headers)}`, 10, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "Too many share links created. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } }
    );
  }

  let body: {
    domain?: string;
    timestampA?: string;
    timestampB?: string;
    mode?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const validation = validateDomain(body.domain ?? "");
  if (!validation.ok || !validation.domain || !isCdxTimestamp(body.timestampA ?? "")) {
    return NextResponse.json({ error: "Invalid resource to share." }, { status: 400 });
  }
  const domain = validation.domain;

  // Lab experiment share: a single timestamp + a valid lab mode.
  if (body.mode) {
    const mode = getLabMode(body.mode);
    if (!mode) {
      return NextResponse.json({ error: "Invalid resource to share." }, { status: 400 });
    }
    // The share page re-runs the deterministic transformation, so the shared
    // URL needs only the source snapshot and mode.
    return NextResponse.json(
      { url: `/share/lab/${domain}/${body.timestampA}/${mode.id}` },
      { status: 201 }
    );
  }

  if (!isCdxTimestamp(body.timestampB ?? "") || body.timestampA === body.timestampB) {
    return NextResponse.json({ error: "Invalid comparison to share." }, { status: 400 });
  }

  const timestampA = body.timestampA!;
  const timestampB = body.timestampB!;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const share = await prisma.share.create({
        data: { slug: slugify(domain, timestampA, timestampB), domain, timestampA, timestampB },
      });
      return NextResponse.json({ url: `/share/${share.slug}` }, { status: 201 });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") continue; // slug collision — retry with new suffix
      logger.error("share creation failed", { err: String(err) });
      return NextResponse.json(
        { error: "Could not create the share link. Please try again." },
        { status: 500 }
      );
    }
  }
  return NextResponse.json({ error: "Could not create the share link." }, { status: 500 });
}
