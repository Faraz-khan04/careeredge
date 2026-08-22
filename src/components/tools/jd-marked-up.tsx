"use client";

import * as React from "react";

import type { JdAnalysis, MatchedSignal } from "@/lib/engines/jd-parser";
import { cn } from "@/lib/utils";

const TONE = {
  high: {
    mark: "bg-[hsl(var(--drop))]/25 decoration-[hsl(var(--drop))]",
    dot: "bg-[hsl(var(--drop))]",
  },
  medium: {
    mark: "bg-[hsl(var(--caution))]/25 decoration-[hsl(var(--caution))]",
    dot: "bg-[hsl(var(--caution))]",
  },
  low: {
    mark: "bg-muted-foreground/20 decoration-muted-foreground",
    dot: "bg-muted-foreground",
  },
} as const;

interface Segment {
  text: string;
  signal?: MatchedSignal;
  kind: "red" | "green" | null;
}

/**
 * Renders the posting with every matched phrase highlighted in place.
 *
 * This is the honest version of a red-flag tool: rather than asserting that a
 * posting is bad, it shows the reader exactly which words triggered which
 * conclusion, in context, so they can disagree. It is also the thing people
 * screenshot.
 */
export function MarkedUpPosting({ text, analysis }: { text: string; analysis: JdAnalysis }) {
  const [active, setActive] = React.useState<string | null>(null);

  const segments = React.useMemo(() => buildSegments(text, analysis), [text, analysis]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        {(["high", "medium", "low"] as const).map((sev) => (
          <span key={sev} className="flex items-center gap-1.5 text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-sm", TONE[sev].dot)} aria-hidden="true" />
            {sev === "high" ? "Costly" : sev === "medium" ? "Worth asking" : "Worth noting"}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-sm bg-[hsl(var(--lift))]" aria-hidden="true" />
          In its favour
        </span>
      </div>

      <div className="rounded-xl p-5 panel sm:p-6">
        <p className="whitespace-pre-wrap font-mono text-xs leading-[1.9] sm:text-[0.8125rem]">
          {segments.map((seg, i) =>
            seg.signal ? (
              <mark
                key={i}
                onMouseEnter={() => setActive(seg.signal!.id)}
                onMouseLeave={() => setActive(null)}
                tabIndex={0}
                onFocus={() => setActive(seg.signal!.id)}
                onBlur={() => setActive(null)}
                title={seg.signal.label}
                className={cn(
                  "rounded-sm px-0.5 text-foreground underline decoration-dotted decoration-2 underline-offset-4 transition-colors",
                  seg.kind === "green"
                    ? "bg-[hsl(var(--lift))]/20 decoration-[hsl(var(--lift))]"
                    : TONE[seg.signal.severity].mark,
                  active === seg.signal.id && "ring-1 ring-primary",
                )}
              >
                {seg.text}
              </mark>
            ) : (
              <React.Fragment key={i}>{seg.text}</React.Fragment>
            ),
          )}
        </p>
      </div>

      {active && (
        <p className="rounded-lg border border-border bg-white/[0.02] p-4 text-sm leading-relaxed text-muted-foreground">
          <strong className="font-medium text-foreground">
            {[...analysis.redFlags, ...analysis.greenFlags].find((f) => f.id === active)?.label}:{" "}
          </strong>
          {[...analysis.redFlags, ...analysis.greenFlags].find((f) => f.id === active)?.meaning}
        </p>
      )}
    </div>
  );
}

/**
 * Splits the text into highlighted and plain runs.
 *
 * Matches are sorted by position and any that overlap an earlier one are
 * dropped — two marks cannot wrap the same characters, and the earlier match
 * is the more severe one because the flags arrive severity-sorted.
 */
function buildSegments(text: string, analysis: JdAnalysis): Segment[] {
  const marks = [
    ...analysis.redFlags.map((s) => ({ signal: s, kind: "red" as const })),
    ...analysis.greenFlags.map((s) => ({ signal: s, kind: "green" as const })),
  ].sort((a, b) => a.signal.start - b.signal.start);

  const segments: Segment[] = [];
  let cursor = 0;

  for (const { signal, kind } of marks) {
    if (signal.start < cursor) continue; // overlapping — skip
    if (signal.start > cursor) {
      segments.push({ text: text.slice(cursor, signal.start), kind: null });
    }
    segments.push({ text: text.slice(signal.start, signal.end), signal, kind });
    cursor = signal.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), kind: null });
  }

  return segments;
}

/**
 * The questions the flags generated, as something you can actually take into
 * a call.
 */
export function QuestionChecklist({ questions }: { questions: string[] }) {
  const [copied, setCopied] = React.useState(false);
  const [checked, setChecked] = React.useState<Set<number>>(new Set());

  if (questions.length === 0) return null;

  async function copyAll() {
    const body = questions.map((q) => `- ${q}`).join("\n");
    try {
      await navigator.clipboard.writeText(`Questions for the employer:\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard unavailable — the list is on screen and can be copied by hand.
    }
  }

  return (
    <section className="rounded-xl p-5 panel sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">
          {questions.length} question{questions.length === 1 ? "" : "s"} to ask them
        </h2>
        <button
          type="button"
          onClick={copyAll}
          className="rounded-md border border-border px-3 py-1 text-xs transition-colors hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? "Copied" : "Copy all"}
        </button>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Put these on the first call, before you invest a week in interviews. Every one comes from
        something the posting left unsaid.
      </p>

      <ul className="mt-4 space-y-2.5">
        {questions.map((q, i) => (
          <li key={q}>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                checked={checked.has(i)}
                onChange={() =>
                  setChecked((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  })
                }
                className="mt-1 h-3.5 w-3.5 shrink-0 accent-[hsl(var(--primary))]"
              />
              <span className={cn(checked.has(i) && "text-muted-foreground line-through")}>
                {q}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
