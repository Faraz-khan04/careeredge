import type { Metadata } from "next";
import Link from "next/link";

import { ApplicationTracker } from "@/components/tools/application-tracker";
import { HowItWorks } from "@/components/ui/info-tip";

export const metadata: Metadata = {
  title: "Application tracker — see where your applications stop",
  description:
    "Log your job applications and see your own funnel: where they stop, and which skills the roles you target keep asking for. Runs in your browser.",
};

export default function ApplicationTrackerPage() {
  return (
    <div className="relative">
      <div className="container relative max-w-4xl scroll-mt-24 pb-24 pt-16">
        <header className="mb-8">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
            Application tracker
          </p>
          <h1 className="mt-3 text-display-2 font-semibold tracking-tight">
            Where do your applications actually stop?
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Applying to fifty jobs and hearing nothing tells you very little. Logging where each one
            ended tells you a lot &mdash; whether the problem is getting seen, getting through a
            recruiter call, or converting interviews.
          </p>
        </header>

        <HowItWorks
          className="mb-8"
          steps={[
            {
              title: "Log each application",
              detail:
                "Company, role, and the skills the posting asked for. Takes about twenty seconds.",
            },
            {
              title: "Update the stage",
              detail:
                "Move it along as things happen. The furthest stage reached is kept even after a rejection.",
            },
            {
              title: "Read it after twenty",
              detail:
                "Below that, percentages swing on single outcomes. We will say so rather than pretend otherwise.",
            },
          ]}
        />

        <ApplicationTracker />

        <div className="mt-10 max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="font-medium text-foreground">
              Why this does not tell you why you were rejected.
            </strong>{" "}
            Because nobody can. Employers do not disclose it, and the same silence covers a hiring
            freeze, an internal candidate who was always going to get it, an application that
            arrived late, and a genuine skills gap. Any tool claiming to separate those is guessing
            and charging you for it.
          </p>
          <p>
            What this does instead is count what you observed. Where applications stop is real
            information, and so is which skills the roles you target keep asking for.{" "}
            <Link href="/tools/skill-arbitrage" className="text-primary hover:underline">
              Skill ROI
            </Link>{" "}
            can price those gaps once you see them.
          </p>
        </div>
      </div>
    </div>
  );
}
