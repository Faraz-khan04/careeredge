import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { CtcCalculator } from "@/components/tools/ctc-calculator";
import { HowItWorks } from "@/components/ui/info-tip";

export const metadata: Metadata = {
  title: "CTC to in-hand salary calculator",
  description:
    "Find out what your CTC actually pays you each month, after PF, gratuity, professional tax and income tax. Compares the old and new tax regimes.",
};

export default function CtcCalculatorPage() {
  return (
    <div className="relative">
      <div className="container relative scroll-mt-24 pb-24 pt-16">
        <header className="mb-8 max-w-2xl">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
            Free tool &middot; India
          </p>
          <h1 className="mt-3 text-display-2 font-semibold tracking-tight">
            What will this CTC actually pay me?
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            The number on your offer letter is not the number in your bank account. Part of it goes
            to provident fund and gratuity before you ever see it, part is a bonus that depends on
            performance, and then tax comes out. This shows you the month-to-month figure.
          </p>
        </header>

        <HowItWorks
          className="mb-8"
          steps={[
            {
              title: "Set the CTC",
              detail:
                "Drag the slider to the offer. Everything recalculates as you move it \u2014 no submit button.",
            },
            {
              title: "Match your offer letter",
              detail:
                "Adjust the basic pay share and variable component. Both are printed in your offer breakdown.",
            },
            {
              title: "Compare both tax regimes",
              detail:
                "We calculate old and new side by side and tell you which is cheaper for your situation.",
            },
          ]}
        />

        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg border bg-card" />}>
          <CtcCalculator />
        </Suspense>

        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Comparing an Indian offer against one from abroad?{" "}
          <Link href="/tools/remote-pay-equity" className="text-primary hover:underline">
            The pay equity tool
          </Link>{" "}
          handles cross-border offers and purchasing power.
        </p>
      </div>
    </div>
  );
}
