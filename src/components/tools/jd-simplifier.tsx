"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  Info,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { analyseJobDescription, type JdAnalysis, type MatchedSignal } from "@/lib/engines/jd-parser";
import { MarkedUpPosting, QuestionChecklist } from "@/components/tools/jd-marked-up";
import { cn, formatCurrency } from "@/lib/utils";

const SAMPLE = `Senior Frontend Engineer — Bengaluru (Hybrid)

We're a fast-paced, rapidly evolving startup and we're looking for a rockstar engineer who can wear many hats and hit the ground running from day one. We're like a family here.

Responsibilities
- Own the entire frontend stack end to end
- Work closely with design, product, backend and QA
- Participate in on-call rotation

Requirements
- 5+ years with React, TypeScript, Next.js, GraphQL, Node.js, Docker, Kubernetes, AWS, Terraform, PostgreSQL, Redis and CI/CD
- Must work well under pressure and tight deadlines
- Self-starter who needs minimal supervision
- Immediate joiners preferred
- Candidates will be required to sign a 2 year service bond

Compensation is commensurate with experience. Competitive salary and unlimited PTO.`;

const SEVERITY_STYLE = {
  high: "border-[hsl(var(--drop))]/30 bg-[hsl(var(--drop))]/[0.07]",
  medium: "border-[hsl(var(--caution))]/30 bg-[hsl(var(--caution))]/[0.07]",
  low: "border-border bg-secondary/30",
} as const;

const SEVERITY_TEXT = {
  high: "text-[hsl(var(--drop))]",
  medium: "text-[hsl(var(--caution))]",
  low: "text-muted-foreground",
} as const;

const SEVERITY_LABEL = {
  high: "Costly",
  medium: "Worth asking",
  low: "Worth noting",
} as const;

export function JdSimplifier() {
  const [text, setText] = React.useState("");
  const [analysis, setAnalysis] = React.useState<JdAnalysis | null>(null);
  const [view, setView] = React.useState<"report" | "markup">("report");

  // Parsing is a synchronous pure function over a few thousand characters, so
  // it can run on every keystroke. The timeout only coalesces fast typing.
  React.useEffect(() => {
    if (text.trim().length < 60) {
      setAnalysis(null);
      return;
    }
    const t = setTimeout(() => setAnalysis(analyseJobDescription(text)), 140);
    return () => clearTimeout(t);
  }, [text]);

  async function pasteFromClipboard() {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip.trim()) setText(clip);
    } catch {
      // Clipboard access denied — the textarea still works normally.
    }
  }

  const arbitrageHref = analysis?.role
    ? `/tools/skill-arbitrage?role=${analysis.role.id}` +
      (analysis.matchedSkills.length
        ? `&skills=${analysis.matchedSkills.slice(0, 6).map((s) => s.id).join(",")}`
        : "") +
      (analysis.marketId ? `&market=${analysis.marketId}` : "") +
      (analysis.yearsRequired ? `&yoe=${analysis.yearsRequired}` : "")
    : "/tools/skill-arbitrage";

  const isInr = analysis?.statedSalary?.currency === "INR";
  const ctcHref = isInr
    ? `/tools/ctc-calculator?ctc=${Math.round(analysis!.statedSalary!.min)}`
    : "/tools/ctc-calculator";

  const equityHref =
    analysis?.statedSalary && analysis.marketId
      ? `/tools/remote-pay-equity?offer=${Math.round(analysis.statedSalary.min)}&living=${analysis.marketId}`
      : "/tools/remote-pay-equity";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_1fr] lg:items-start lg:gap-8">
      {/* ---------------------------------------------------------------- */}
      {/* Input                                                             */}
      {/* ---------------------------------------------------------------- */}
      <Card className="lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardPaste className="h-4 w-4 text-primary" />
            Paste the posting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="jd" className="sr-only">
            Job description text
          </Label>
          <textarea
            id="jd"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
            spellCheck={false}
            placeholder="Paste the full job description here. Nothing is uploaded — the analysis runs in your browser."
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary"
          />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={pasteFromClipboard}>
              <ClipboardPaste className="h-3.5 w-3.5" />
              Paste
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setText(SAMPLE)}>
              Try a sample
            </Button>
            {text && (
              <Button variant="ghost" size="sm" onClick={() => setText("")}>
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            This runs entirely in your browser. The text is never sent anywhere, so you can paste a
            posting you were emailed privately.
          </p>
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Analysis                                                          */}
      {/* ---------------------------------------------------------------- */}
      {!analysis ? (
        <EmptyState onSample={() => setText(SAMPLE)} />
      ) : (
        <div className="space-y-5">
          {/* View switch */}
          <div
            role="group"
            aria-label="View"
            className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-white/[0.02] p-1 sm:inline-grid sm:grid-cols-[auto_auto]"
          >
            {(
              [
                ["report", "Report"],
                ["markup", "Marked-up ad"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                aria-pressed={view === value}
                className={
                  view === value
                    ? "rounded-md bg-card px-4 py-1.5 text-sm font-medium shadow-sm"
                    : "rounded-md px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {label}
              </button>
            ))}
          </div>

          {view === "markup" && <MarkedUpPosting text={text} analysis={analysis} />}

          {/* Verdict */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow">What this posting tells you</p>
                  <p className="mt-2 max-w-xl leading-relaxed">{analysis.verdict}</p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "tabular font-mono text-4xl font-semibold tracking-tight",
                      analysis.clarityScore >= 70
                        ? "text-[hsl(var(--lift))]"
                        : analysis.clarityScore >= 45
                          ? "text-[hsl(var(--caution))]"
                          : "text-[hsl(var(--drop))]",
                    )}
                  >
                    {analysis.clarityScore}
                  </p>
                  <p className="eyebrow mt-1">Clarity / 100</p>
                </div>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
                <Fact label="Role read as" value={analysis.role?.name ?? "Not stated"} />
                <Fact
                  label="Pay disclosed"
                  value={
                    analysis.statedSalary
                      ? `${formatCurrency(analysis.statedSalary.min, analysis.statedSalary.currency)}${
                          analysis.statedSalary.max
                            ? `–${formatCurrency(analysis.statedSalary.max, analysis.statedSalary.currency)}`
                            : "+"
                        }`
                      : "No"
                  }
                  tone={analysis.statedSalary ? "lift" : "drop"}
                />
                <Fact
                  label="Experience asked"
                  value={analysis.yearsRequired ? `${analysis.yearsRequired}+ years` : "Not stated"}
                />
                <Fact label="Reading time" value={`${analysis.readingMinutes} min`} />
              </dl>
            </CardContent>
          </Card>

          {/* Red flags */}
          {view === "report" && analysis.redFlags.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--caution))]" />
                What to look at twice
              </h2>
              <div className="mt-3 space-y-3">
                {analysis.redFlags.map((flag) => (
                  <SignalCard key={flag.id} signal={flag} />
                ))}
              </div>
            </section>
          )}

          {/* Counted observations */}
          {view === "report" && analysis.observations.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Info className="h-4 w-4 text-primary" />
                What the numbers say
              </h2>
              <div className="mt-3 space-y-3">
                {analysis.observations.map((o) => (
                  <div
                    key={o.label}
                    className={cn("rounded-lg border p-4", SEVERITY_STYLE[o.severity])}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{o.label}</p>
                      <span className={cn("font-mono text-xs", SEVERITY_TEXT[o.severity])}>
                        {SEVERITY_LABEL[o.severity]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {o.detail}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Green flags */}
          {view === "report" && analysis.greenFlags.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lift))]" />
                In its favour
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {analysis.greenFlags.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-lg border border-[hsl(var(--lift))]/25 bg-[hsl(var(--lift))]/[0.06] p-4"
                  >
                    <p className="text-sm font-medium">{g.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{g.meaning}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Questions */}
          <QuestionChecklist questions={analysis.questions} />

          {/* Skills */}
          {view === "report" &&
            (analysis.matchedSkills.length > 0 || analysis.unrecognisedSkills.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {analysis.matchedSkills.length + analysis.unrecognisedSkills.length} skills asked
                  for
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.matchedSkills.length > 0 && (
                  <div>
                    <p className="eyebrow">Priced in our data</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {analysis.matchedSkills.map((s) => (
                        <li
                          key={s.id}
                          className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-mono text-xs text-primary"
                        >
                          {s.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.unrecognisedSkills.length > 0 && (
                  <div>
                    <p className="eyebrow">Mentioned, not in our dataset</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {analysis.unrecognisedSkills.map((s) => (
                        <li
                          key={s}
                          className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted-foreground"
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Handoff */}
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div>
                <p className="text-sm font-medium">Take it further</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isInr
                    ? "This posting quotes a rupee figure, so the CTC calculator will show what it pays monthly."
                    : "The calculators open with what we read from this posting already filled in."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href={arbitrageHref}>
                    Check skill ROI
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                {isInr ? (
                  <Button asChild>
                    <Link href={ctcHref}>
                      What it pays monthly
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href={equityHref}>
                      Check COLA value
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <p className="text-xs leading-relaxed text-muted-foreground">
            These are patterns, not verdicts on any employer. Plenty of good companies write careless
            postings, and a phrase flagged here may be entirely innocent in context — the excerpt is
            shown so you can judge it yourself.
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Fact({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "lift" | "drop";
}) {
  return (
    <div className="min-w-0">
      <dd
        className={cn(
          "truncate text-sm font-medium",
          tone === "lift" && "text-[hsl(var(--lift))]",
          tone === "drop" && "text-[hsl(var(--drop))]",
        )}
      >
        {value}
      </dd>
      <dt className="eyebrow mt-1">{label}</dt>
    </div>
  );
}

function SignalCard({ signal }: { signal: MatchedSignal }) {
  return (
    <div className={cn("rounded-lg border p-4", SEVERITY_STYLE[signal.severity])}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{signal.label}</p>
        <span className={cn("font-mono text-xs", SEVERITY_TEXT[signal.severity])}>
          {SEVERITY_LABEL[signal.severity]}
        </span>
      </div>

      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{signal.meaning}</p>

      {/* Shown so the reader can judge the match themselves. */}
      <p className="mt-3 border-l-2 border-border pl-3 font-mono text-xs leading-relaxed text-muted-foreground/80">
        {signal.excerpt}
      </p>

      {signal.ask && (
        <p className="mt-3 text-sm">
          <span className="font-medium">Ask them: </span>
          <span className="text-muted-foreground">{signal.ask}</span>
        </p>
      )}
    </div>
  );
}

function EmptyState({ onSample }: { onSample: () => void }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
      <h2 className="text-lg font-semibold">Paste a posting to see what it actually says</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        We read it for the things postings tend to bury: terms that cost you money, requirements
        that contradict the job title, and whether they were willing to name a number.
      </p>
      <Button variant="outline" className="mt-6" onClick={onSample}>
        Try it on a sample posting
      </Button>
    </div>
  );
}
