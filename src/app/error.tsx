"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary.
 *
 * Without this, an exception anywhere in a route segment renders a blank page
 * in production — the worst possible failure on a site people are using to
 * make decisions about money.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Replace with your reporting sink when you add one.
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[hsl(var(--caution))]">
        Something broke
      </p>
      <h1 className="mt-4 text-display-2 font-semibold tracking-tight">
        That didn&rsquo;t work.
      </h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        The error is on our side, not yours. Nothing you entered was saved, so trying again is
        safe.
      </p>

      {error.digest && (
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          reference {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
