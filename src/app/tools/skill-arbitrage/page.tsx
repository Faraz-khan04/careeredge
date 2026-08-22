import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { SkillArbitrageCalculator } from "@/components/tools/skill-arbitrage-calculator";
import { HowItWorks } from "@/components/ui/info-tip";

export const metadata: Metadata = {
  title: "Skill ROI \u2014 which skill is worth learning next",
  description:
    "See how much more you could earn from each skill you could learn, and how many hours it would take. Free, no sign-up.",
};

export default function SkillArbitragePage() {
  return (
    <div className="relative">
      <div className="container relative scroll-mt-24 pb-24 pt-16">
        <header className="mb-8 max-w-2xl">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
            Skill ROI
          </p>
          <h1 className="mt-3 text-display-2 font-semibold tracking-tight">
            Which skill is worth learning next?
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Some skills pay well but take a year to learn. Others pay a little and take a weekend.
            This shows you both numbers side by side, so you can pick the ones worth your time.
          </p>
        </header>

        <HowItWorks
          className="mb-8"
          steps={[
            {
              title: "Tell us where you are",
              detail:
                "Your job title, the skills you already have, and your city. New to this? Switch to \u201cI\u2019m starting out\u201d.",
            },
            {
              title: "Results appear as you type",
              detail:
                "There is no submit button. Change anything and the numbers update straight away.",
            },
            {
              title: "Read the top three",
              detail:
                "Each card shows the extra yearly pay, the study hours, and how many weeks that means for you.",
            },
          ]}
        />

        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg border bg-card" />}>
          <SkillArbitrageCalculator />
        </Suspense>

        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          These are typical figures for people with a similar background, not a promise about your
          own pay.{" "}
          <Link href="/methodology" className="text-primary hover:underline">
            See how we work them out
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
