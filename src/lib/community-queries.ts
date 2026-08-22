import "server-only";

import { prisma } from "@/lib/prisma";
import { wilsonScore } from "@/lib/utils";
import type { FeedPost } from "@/components/community/post-card";
import type { CommentNode } from "@/components/community/comment-thread";
import type { TagKey } from "@/components/community/tag-pill";
import type { RemotePayEquityResult, SkillArbitrageResult } from "@/types";

export type FeedSort = "hot" | "new" | "top" | "discussed";

const EXCERPT_LENGTH = 220;

function excerptFrom(markdown: string): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`~\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > EXCERPT_LENGTH ? `${plain.slice(0, EXCERPT_LENGTH)}…` : plain;
}

/**
 * `isAnonymous` is enforced here rather than in the component. The author
 * relation is loaded because moderation needs it, but nothing identifying is
 * ever placed on the returned object for an anonymous post.
 */
export async function getFeed(options: {
  sort?: FeedSort;
  tag?: TagKey;
  take?: number;
}): Promise<FeedPost[]> {
  const { sort = "hot", tag, take = 25 } = options;

  const orderBy =
    sort === "new"
      ? { createdAt: "desc" as const }
      : sort === "discussed"
        ? { commentCount: "desc" as const }
        : sort === "top"
          ? { upvotes: "desc" as const }
          : { hotScore: "desc" as const };

  const rows = await prisma.post.findMany({
    where: {
      moderation: "PUBLISHED",
      ...(tag ? { tags: { has: tag } } : {}),
    },
    orderBy,
    take,
    include: {
      author: { select: { handle: true, verification: true } },
      embeddedCalculation: { select: { type: true, result: true } },
    },
  });

  const mapped: FeedPost[] = rows.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: excerptFrom(post.content),
    tags: post.tags as TagKey[],
    isAnonymous: post.isAnonymous,
    authorBadge: post.isAnonymous ? null : post.authorBadge,
    authorHandle: post.isAnonymous ? null : post.author.handle,
    isVerified: post.isAnonymous ? false : post.author.verification === "VERIFIED",
    upvotes: post.upvotes,
    downvotes: post.downvotes,
    commentCount: post.commentCount,
    createdAt: post.createdAt.toISOString(),
    embed: post.embeddedCalculation
      ? {
          type: post.embeddedCalculation.type as "SKILL_ARBITRAGE" | "REMOTE_PAY_EQUITY",
          result: post.embeddedCalculation.result as unknown as
            | SkillArbitrageResult
            | RemotePayEquityResult,
        }
      : null,
  }));

  // "Top" uses a Wilson lower bound so a 3-of-3 post doesn't outrank a 180-of-200
  // post. Postgres orders by raw upvotes first; this refines the shortlist.
  if (sort === "top") {
    mapped.sort(
      (a, b) => wilsonScore(b.upvotes, b.downvotes) - wilsonScore(a.upvotes, a.downvotes),
    );
  }

  return mapped;
}

export async function getPostBySlug(slug: string) {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { handle: true, verification: true } },
      embeddedCalculation: { select: { type: true, result: true } },
    },
  });

  if (!post || post.moderation !== "PUBLISHED") return null;

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    tags: post.tags as TagKey[],
    isAnonymous: post.isAnonymous,
    authorBadge: post.isAnonymous ? null : post.authorBadge,
    authorHandle: post.isAnonymous ? null : post.author.handle,
    isVerified: post.isAnonymous ? false : post.author.verification === "VERIFIED",
    upvotes: post.upvotes,
    downvotes: post.downvotes,
    commentCount: post.commentCount,
    createdAt: post.createdAt.toISOString(),
    embed: post.embeddedCalculation
      ? {
          type: post.embeddedCalculation.type as "SKILL_ARBITRAGE" | "REMOTE_PAY_EQUITY",
          result: post.embeddedCalculation.result as unknown as
            | SkillArbitrageResult
            | RemotePayEquityResult,
        }
      : null,
  };
}

/**
 * Ordering by the materialised `path` returns the whole tree already in
 * depth-first order, so the tree can be assembled in one pass with no
 * recursive queries.
 */
export async function getCommentTree(postId: string): Promise<CommentNode[]> {
  const rows = await prisma.comment.findMany({
    where: { postId, moderation: "PUBLISHED" },
    orderBy: { path: "asc" },
    include: { author: { select: { handle: true, verification: true } } },
  });

  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      content: row.content,
      isAnonymous: row.isAnonymous,
      authorHandle: row.isAnonymous ? null : row.author.handle,
      authorBadge: row.isAnonymous ? null : row.authorBadge,
      isVerified: row.isAnonymous ? false : row.author.verification === "VERIFIED",
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      createdAt: row.createdAt.toISOString(),
      depth: row.depth,
      replies: [],
    });
  }

  for (const row of rows) {
    const node = byId.get(row.id);
    if (!node) continue;
    if (row.parentId) byId.get(row.parentId)?.replies.push(node);
    else roots.push(node);
  }

  return roots;
}
