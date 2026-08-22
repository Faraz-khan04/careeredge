import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { RemotePayEquityCalculator } from "@/components/tools/remote-pay-equity-calculator";
import { HowItWorks } from "@/components/ui/info-tip";

export const metadata: Metadata = {
  title: "Cost-of-living adjusted pay \u2014 what an offer is really worth",
  description:
    "Find out what a remote or cross-border job offer is actually worth where you live, after tax, currency costs and the benefits contractors lose.",
};

export default function RemotePayEquityPage() {
  return (
    <div className="relative">
      <div className="container relative scroll-mt-24 pb-24 pt-16">
        <header className="mb-8 max-w-2xl">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
            Cost-of-living adjusted pay
          </p>
          <h1 className="mt-3 text-display-2 font-semibold tracking-tight">
            What is this offer really worth?
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            A big number in one currency can be a small life in another. This works out what
            actually reaches your account, and what that money buys where you live &mdash; a
            cost-of-living adjusted figure, or COLA.
          </p>
        </header>

        <HowItWorks
          className="mb-8"
          steps={[
            {
              title: "Enter the offer",
              detail:
                "The salary they named, the city the company pays from, and the city you live in.",
            },
            {
              title: "Pick employee or contractor",
              detail:
                "This matters a lot. Contractors pay more tax and buy their own benefits, so the same number is worth less.",
            },
            {
              title: "See what is left",
              detail:
                "Every deduction is listed with a plain explanation, ending with what lands in your account.",
            },
          ]}
        />

        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg border bg-card" />}>
          <RemotePayEquityCalculator />
        </Suspense>

        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Tax figures are planning estimates, not a filing calculation, and they cannot see your
          personal situation.{" "}
          <Link href="/methodology" className="text-primary hover:underline">
            See how we work them out
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
