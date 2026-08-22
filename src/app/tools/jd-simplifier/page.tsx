import type { Metadata } from "next";

import { JdSimplifier } from "@/components/tools/jd-simplifier";
import { HowItWorks } from "@/components/ui/info-tip";

export const metadata: Metadata = {
  title: "Job description simplifier",
  description:
    "Paste a job posting and see what it actually says: terms that cost you money, requirements that contradict the title, and whether they named a number.",
};

export default function JdSimplifierPage() {
  return (
    <div className="relative">
      <div className="container relative scroll-mt-24 pb-24 pt-16">
        <header className="mb-8 max-w-2xl">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
            Job description simplifier
          </p>
          <h1 className="mt-3 text-display-2 font-semibold tracking-tight">
            What is this job ad really saying?
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Job ads are written to attract you, not to inform you. Paste one in and we will point
            out the parts that could cost you money, the requirements that do not add up, and the
            questions worth asking before you spend a week on interviews.
          </p>
        </header>

        <HowItWorks
          className="mb-8"
          steps={[
            {
              title: "Paste the job ad",
              detail:
                "Copy the whole thing. It stays in your browser and is never sent to us, so a private email is fine.",
            },
            {
              title: "Read the flags",
              detail:
                "Each one shows the exact words that triggered it, so you can decide for yourself if it matters.",
            },
            {
              title: "Ask better questions",
              detail:
                "Several flags come with a question to put to the employer on your first call.",
            },
          ]}
        />

        <JdSimplifier />
      </div>
    </div>
  );
}
