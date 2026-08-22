import type { Metadata } from "next";
import Link from "next/link";
import { PenLine } from "lucide-react";

import { getFeed, type FeedSort } from "@/lib/community-queries";
import { PostCard } from "@/components/community/post-card";
import { TAG_LABEL, type TagKey } from "@/components/community/tag-pill";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Offer reviews, salary transparency, interview breakdowns and skill roadmaps — anonymous or with a verified role badge.",
};

export const dynamic = "force-dynamic";

const SORTS: { value: FeedSort; label: string }[] = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "Newest" },
  { value: "top", label: "Top" },
  { value: "discussed", label: "Most discussed" },
];

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; tag?: string }>;
}) {
  const sp = await searchParams;
  const sort = (SORTS.find((s) => s.value === sp.sort)?.value ?? "hot") as FeedSort;
  const tag = (sp.tag && sp.tag in TAG_LABEL ? sp.tag : undefined) as TagKey | undefined;

  const posts = await getFeed({ sort, tag });

  const query = (next: { sort?: FeedSort; tag?: TagKey | null }) => {
    const params = new URLSearchParams();
    const nextSort = next.sort ?? sort;
    const nextTag = next.tag === null ? undefined : (next.tag ?? tag);
    if (nextSort !== "hot") params.set("sort", nextSort);
    if (nextTag) params.set("tag", nextTag);
    const qs = params.toString();
    return qs ? `/community?${qs}` : "/community";
  };

  return (
    <div className="container grid gap-10 scroll-mt-24 pb-24 pt-16 lg:grid-cols-[1fr_280px] lg:items-start">
      <div className="min-w-0">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
              Peer review
            </p>
            <h1 className="mt-2 text-display-2 font-semibold tracking-tight">Community</h1>
            <p className="mt-2 max-w-lg text-muted-foreground">
              Real numbers from people in the same role and market. Attach a calculation and
              ask whether it holds up.
            </p>
          </div>
          <Button className="border-beam aura" asChild>
            <Link href="/community/new">
              <PenLine className="h-4 w-4" />
              New post
            </Link>
          </Button>
        </header>

        <nav
          className="mb-4 flex flex-wrap gap-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-1"
          aria-label="Sort posts"
        >
          {SORTS.map((option) => (
            <Link
              key={option.value}
              href={query({ sort: option.value })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                sort === option.value
                  ? "bg-card font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </Link>
          ))}
        </nav>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.12] px-6 py-16 text-center panel">
            <h2 className="text-base font-semibold">
              {tag ? `Nothing in ${TAG_LABEL[tag]} yet` : "No posts yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {tag
                ? "Start the channel off — the first post in a quiet channel gets read closely."
                : "Run a calculator, attach the result, and ask the room what they think."}
            </p>
            <Button className="mt-5" asChild>
              <Link href="/community/new">Write the first post</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl panel">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24">
        <section className="rounded-xl p-4 panel">
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
            Channels
          </h2>
          <ul className="mt-3 space-y-0.5">
            <li>
              <Link
                href={query({ tag: null })}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-white/[0.05]",
                  !tag ? "bg-white/[0.06] font-medium" : "text-muted-foreground",
                )}
              >
                All channels
              </Link>
            </li>
            {(Object.keys(TAG_LABEL) as TagKey[]).map((key) => (
              <li key={key}>
                <Link
                  href={query({ tag: key })}
                  className={cn(
                    "block rounded-md px-3 py-1.5 font-mono text-sm transition-colors hover:bg-white/[0.05]",
                    tag === key
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {TAG_LABEL[key]}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl p-4 panel">
          <h2 className="text-sm font-semibold">Posting here</h2>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              Numbers, levels and locations. No employer names.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              Anonymous mode strips your handle and badge entirely.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              Emails, phone numbers and profile links are blocked before publish.
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
