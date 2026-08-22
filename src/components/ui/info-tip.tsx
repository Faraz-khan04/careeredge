"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";

import { GLOSSARY, type GlossaryKey } from "@/data/glossary";
import { cn } from "@/lib/utils";

/**
 * A definition anyone can reach.
 *
 * Opens on click rather than hover, because hover does not exist on a phone
 * and hover-only tooltips are one of the most common ways a site becomes
 * unusable on mobile. It is a real button, so it is reachable by keyboard and
 * announced by a screen reader, and Escape closes it.
 */
export function InfoTip({ term, className }: { term: GlossaryKey; className?: string }) {
  const entry = GLOSSARY[term];
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className={cn("relative inline-flex items-center align-middle", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`What does "${entry.term}" mean?`}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg p-3 text-left panel"
        >
          <span className="block text-xs font-semibold">{entry.term}</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            {entry.short}
          </span>
          {"example" in entry && entry.example && (
            <span className="mt-2 block text-xs leading-relaxed text-muted-foreground/80">
              {entry.example}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

/**
 * A short strip explaining what a tool does and what to enter, shown above the
 * form. Nobody should have to guess what a field wants or what they will get
 * back.
 */
export function HowItWorks({
  steps,
  className,
}: {
  steps: { title: string; detail: string }[];
  className?: string;
}) {
  return (
    <ol
      className={cn(
        "grid gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 sm:grid-cols-3",
        className,
      )}
    >
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 font-mono text-xs font-medium text-primary">
            {i + 1}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium">{step.title}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
              {step.detail}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
