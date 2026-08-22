import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { voteSchema } from "@/lib/schemas";
import { checkRateLimit, RATE_LIMITS } from "@/lib/moderation";
import { getSessionUser } from "@/lib/session";
import { hotScore } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });

  const limit = checkRateLimit(
    `vote:${user.id}`,
    RATE_LIMITS.vote.limit,
    RATE_LIMITS.vote.windowMs,
  );
  if (limit.blocked) {
    return NextResponse.json({ error: "Slow down." }, { status: 429 });
  }

  const raw: unknown = await request.json().catch(() => null);
  const parsed = voteSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vote." }, { status: 422 });
  }

  const { value, postId, commentId } = parsed.data;

  // Everything runs in one transaction so a tally can't drift from its votes.
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.vote.findFirst({
      where: { userId: user.id, postId: postId ?? null, commentId: commentId ?? null },
    });

    let upDelta = 0;
    let downDelta = 0;

    if (!existing) {
      await tx.vote.create({
        data: { userId: user.id, value, postId, commentId },
      });
      if (value === "UP") upDelta = 1;
      else downDelta = 1;
    } else if (existing.value === value) {
      // Same button twice removes the vote.
      await tx.vote.delete({ where: { id: existing.id } });
      if (value === "UP") upDelta = -1;
      else downDelta = -1;
    } else {
      await tx.vote.update({ where: { id: existing.id }, data: { value } });
      if (value === "UP") {
        upDelta = 1;
        downDelta = -1;
      } else {
        upDelta = -1;
        downDelta = 1;
      }
    }

    if (postId) {
      const post = await tx.post.update({
        where: { id: postId },
        data: { upvotes: { increment: upDelta }, downvotes: { increment: downDelta } },
        select: { id: true, upvotes: true, downvotes: true, createdAt: true, authorId: true },
      });
      await tx.post.update({
        where: { id: post.id },
        data: { hotScore: hotScore(post.upvotes, post.downvotes, post.createdAt) },
      });
      await tx.user.update({
        where: { id: post.authorId },
        data: { postKarma: { increment: upDelta - downDelta } },
      });
      return { score: post.upvotes - post.downvotes };
    }

    const comment = await tx.comment.update({
      where: { id: commentId },
      data: { upvotes: { increment: upDelta }, downvotes: { increment: downDelta } },
      select: { upvotes: true, downvotes: true, authorId: true },
    });
    await tx.user.update({
      where: { id: comment.authorId },
      data: { commentKarma: { increment: upDelta - downDelta } },
    });
    return { score: comment.upvotes - comment.downvotes };
  });

  return NextResponse.json(result);
}
