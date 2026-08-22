"use client";

import * as React from "react";
import { Check, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Copies a link that reopens the calculator with the same inputs.
 *
 * The inputs already travel as query parameters — the calculators read them on
 * mount — so a shareable result costs nothing to produce and nothing to store.
 * Someone pasting their result into a group chat is the cheapest distribution
 * this site has.
 */
export function ShareResult({
  params,
  label = "Copy link to this result",
}: {
  /** Query parameters describing the run, e.g. { role: "…", market: "…" }. */
  params: Record<string, string | number | undefined>;
  label?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") search.set(key, String(value));
    }

    const url = `${window.location.origin}${window.location.pathname}?${search.toString()}`;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard blocked (insecure context, or permission denied). Put the
      // URL in the address bar so it can still be copied by hand.
      window.history.replaceState(null, "", `?${search.toString()}`);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <Button type="button" variant="outline" onClick={copy} aria-live="polite">
      {copied ? (
        <>
          <Check className="h-4 w-4 text-[hsl(var(--lift))]" />
          Link copied
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}
