import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { getPostBySlug, getCommentTree } from "@/lib/community-queries";
import { CommentThread } from "@/components/community/comment-thread";
import { CalculationEmbed } from "@/components/community/calculation-embed";
import { VoteControl } from "@/components/community/vote-control";
import { TagPill } from "@/components/community/tag-pill";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.content.slice(0, 155),
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const comments = await getCommentTree(post.id);

  return (
    <div className="container max-w-3xl scroll-mt-24 pb-24 pt-16">
      <Link
        href="/community"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to the feed
      </Link>

      <article className="space-y-5 rounded-xl p-6 panel">
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

        <h1 className="text-display-2 font-semibold tracking-tight text-balance">{post.title}</h1>

        <div className="flex gap-4">
          <VoteControl postId={post.id} initialScore={post.upvotes - post.downvotes} />
          <div className="min-w-0 flex-1 whitespace-pre-wrap text-[15px] leading-relaxed">
            {post.content}
          </div>
        </div>

        {post.embed && <CalculationEmbed type={post.embed.type} result={post.embed.result} />}
      </article>

      <section className="mt-10">
        <h2 className="mb-4 text-sm font-semibold">
          {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
        </h2>
        <CommentThread comments={comments} />
      </section>
    </div>
  );
}
