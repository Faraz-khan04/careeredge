import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createPostSchema } from "@/lib/schemas";
import { validateContent, checkRateLimit, RATE_LIMITS } from "@/lib/moderation";
import { getSessionUser } from "@/lib/session";
import { slugify, hotScore } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to post." }, { status: 401 });
  }

  // Server-side limit keyed on the account, not the browser — clearing
  // localStorage doesn't reset it.
  const limit = checkRateLimit(
    `post:${user.id}`,
    RATE_LIMITS.post.limit,
    RATE_LIMITS.post.windowMs,
  );
  if (limit.blocked) {
    return NextResponse.json(
      { error: "You've hit the posting limit for this hour." },
      { status: 429 },
    );
  }

  const raw: unknown = await request.json().catch(() => null);
  const parsed = createPostSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form." },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // The client already ran this for inline feedback; this run is the one that
  // decides. A crafted request never bypasses it.
  const titleCheck = validateContent(data.title);
  const bodyCheck = validateContent(data.content);
  const blocked = [...titleCheck.findings, ...bodyCheck.findings].filter(
    (f) => f.severity === "block",
  );
  if (blocked.length > 0) {
    return NextResponse.json({ error: blocked[0]?.message, findings: blocked }, { status: 422 });
  }

  // Slug collisions are resolved with a short suffix rather than an error.
  const base = slugify(data.title) || "post";
  let slug = base;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const taken = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) break;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const now = new Date();

  const post = await prisma.post.create({
    data: {
      slug,
      title: data.title,
      content: data.content,
      tags: data.tags,
      isAnonymous: data.isAnonymous,
      authorBadge: data.isAnonymous ? null : user.badge,
      authorId: user.id,
      embeddedCalculationId: data.calculationId,
      hotScore: hotScore(1, 0, now),
      moderationNotes: [...titleCheck.findings, ...bodyCheck.findings].map((f) => f.code),
    },
    select: { slug: true, id: true },
  });

  if (data.calculationId) {
    await prisma.calculationHistory.update({
      where: { id: data.calculationId },
      data: { isShared: true },
    });
  }

  return NextResponse.json(post, { status: 201 });
}
