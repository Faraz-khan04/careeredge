import Link from "next/link";
import { MessageSquare, ShieldCheck } from "lucide-react";

import { relativeTime } from "@/lib/utils";
import { VoteControl } from "@/components/community/vote-control";
import { TagPill, type TagKey } from "@/components/community/tag-pill";
import { CalculationEmbed } from "@/components/community/calculation-embed";
import type { RemotePayEquityResult, SkillArbitrageResult } from "@/types";

export interface FeedPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tags: TagKey[];
  isAnonymous: boolean;
  authorBadge: string | null;
  authorHandle: string | null;
  isVerified: boolean;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
  embed?: {
    type: "SKILL_ARBITRAGE" | "REMOTE_PAY_EQUITY";
    result: SkillArbitrageResult | RemotePayEquityResult;
  } | null;
}

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <article className="flex gap-3 border-b px-4 py-4 transition-colors hover:bg-accent/30 sm:px-5">
      <VoteControl postId={post.id} initialScore={post.upvotes - post.downvotes} />

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {post.tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
          <span aria-hidden="true">·</span>
          {post.isAnonymous ? (
            <span>Anonymous</span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="font-medium text-foreground">{post.authorHandle}</span>
              {post.authorBadge && (
                <span className="flex items-center gap-1 rounded border px-1.5 py-0.5">
                  {post.isVerified && (
                    <ShieldCheck className="h-3 w-3 text-[hsl(var(--lift))]" aria-label="Verified" />
                  )}
                  {post.authorBadge}
                </span>
              )}
            </span>
          )}
          <span aria-hidden="true">·</span>
          <time dateTime={post.createdAt}>{relativeTime(post.createdAt)}</time>
        </div>

        <h2 className="text-base font-semibold leading-snug">
          <Link href={`/community/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </h2>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>

        {post.embed && (
          <CalculationEmbed type={post.embed.type} result={post.embed.result} compact />
        )}

        <Link
          href={`/community/${post.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
        </Link>
      </div>
    </article>
  );
}
