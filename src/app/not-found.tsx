import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
        404 &middot; not found
      </p>
      <h1 className="mt-4 text-display-2 font-semibold tracking-tight">
        Nothing at this address.
      </h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        The page may have moved, or the link may be wrong. The tools below are where most people
        are headed.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/tools/skill-arbitrage">Skill ROI</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/tools/remote-pay-equity">COLA pay</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
