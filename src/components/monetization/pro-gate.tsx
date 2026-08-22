"use client";

import * as React from "react";
import { Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useCalculatorStore } from "@/store/use-calculator-store";
import { cn } from "@/lib/utils";

const PRO_FEATURES = [
  "P75 and P90 percentile bands for every role and market",
  "Itemised tax and statutory-benefit schedules, not blended estimates",
  "Negotiation scripts built from your own calculator run",
  "Alerts when the market rate for your role moves more than 4%",
];

interface ProGateProps {
  children: React.ReactNode;
  /** Short line describing what is behind the blur. */
  label: string;
  className?: string;
}

/**
 * Wraps granular data in a blur until the visitor is on Pro. The blurred layer
 * is `aria-hidden` and non-focusable so a screen reader doesn't read out values
 * the person hasn't paid for and can't see.
 */
export function ProGate({ children, label, className }: ProGateProps) {
  const isPro = useCalculatorStore((s) => s.isPro);
  const setPro = useCalculatorStore((s) => s.setPro);
  const [showUpgrade, setShowUpgrade] = React.useState(false);

  const enabled = process.env.NEXT_PUBLIC_PRO_PAYWALL_ENABLED !== "false";

  if (isPro || !enabled) return <>{children}</>;

  return (
    <>
      <div className={cn("relative overflow-hidden rounded-lg border", className)}>
        {/* `.paywall-blur` also sets pointer-events: none, so nothing inside
            is reachable by mouse, keyboard, or assistive tech. */}
        <div className="paywall-blur" aria-hidden="true">
          {children}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/45 p-6 text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-card">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">{label}</p>
          <Button size="sm" onClick={() => setShowUpgrade(true)}>
            Unlock with Pro
          </Button>
        </div>
      </div>

      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md bg-primary/12">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle>CareerEdge Pro</DialogTitle>
            <DialogDescription>
              The free calculators tell you the median. Pro tells you the top of the band —
              which is the number you actually negotiate against.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2.5 py-1">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex gap-2.5 text-sm">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline gap-2 rounded-lg border bg-muted/40 px-4 py-3">
            <span className="tabular text-2xl font-semibold">$12</span>
            <span className="text-sm text-muted-foreground">per month, cancel anytime</span>
          </div>

          <Button
            className="w-full"
            onClick={() => {
              // Wire to your checkout provider here. The store flag stands in
              // for a real entitlement check against the session.
              setPro(true);
              setShowUpgrade(false);
            }}
          >
            Start Pro
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
