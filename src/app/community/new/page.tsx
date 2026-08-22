import type { Metadata } from "next";
import { Suspense } from "react";

import { PostComposer } from "@/components/community/post-composer";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "New post",
  description: "Share an offer, a salary, or an interview breakdown with the community.",
};

export default function NewPostPage() {
  return (
    <div className="container max-w-2xl scroll-mt-24 pb-24 pt-16">
      <header className="mb-8">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
          Community
        </p>
        <h1 className="mt-3 text-display-2 font-semibold tracking-tight">Ask the room</h1>
        <p className="mt-3 text-muted-foreground">
          Specific numbers get specific answers. Keep employer names out of it.
        </p>
      </header>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <PostComposer />
      </Suspense>
    </div>
  );
}
