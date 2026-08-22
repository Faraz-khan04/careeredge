import { Scale, TrendingUp } from "lucide-react";

import { formatCurrency, formatPercent } from "@/lib/utils";
import type { RemotePayEquityResult, SkillArbitrageResult } from "@/types";

interface CalculationEmbedProps {
  type: "SKILL_ARBITRAGE" | "REMOTE_PAY_EQUITY";
  result: SkillArbitrageResult | RemotePayEquityResult;
  /** Compact form drops the detail rows — used in the feed. */
  compact?: boolean;
}

/**
 * Snapshots are rendered from stored JSON rather than recomputed, so a post
 * from six months ago still shows the numbers its author actually saw.
 */
export function CalculationEmbed({ type, result, compact = false }: CalculationEmbedProps) {
  if (type === "SKILL_ARBITRAGE") {
    const r = result as SkillArbitrageResult;
    const top = r.recommendations.slice(0, compact ? 1 : 3);
    return (
      <figure className="rounded-lg border bg-muted/30">
        <figcaption className="flex items-center gap-2 border-b px-4 py-2">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span className="eyebrow">Skill ROI snapshot</span>
        </figcaption>
        <div className="divide-y">
          {top.map((rec) => (
            <div key={rec.skillId} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
              <span className="text-sm font-medium">{rec.skillName}</span>
              <span className="tabular text-sm text-[hsl(var(--lift))]">
                +{formatCurrency(rec.salaryLift, r.currencyCode)}
                <span className="ml-2 text-muted-foreground">{rec.effectiveHours} hrs</span>
              </span>
            </div>
          ))}
        </div>
        {!compact && (
          <p className="tabular border-t px-4 py-2 text-xs text-muted-foreground">
            Base {formatCurrency(r.baseSalary, r.currencyCode)} · stacked lift{" "}
            {formatPercent(r.stackedLift.liftPct)} over {r.stackedLift.totalHours} hrs
          </p>
        )}
      </figure>
    );
  }

  const r = result as RemotePayEquityResult;
  return (
    <figure className="rounded-lg border bg-muted/30">
      <figcaption className="flex items-center gap-2 border-b px-4 py-2">
        <Scale className="h-3.5 w-3.5 text-primary" />
        <span className="eyebrow">COLA pay snapshot</span>
      </figcaption>
      <div className="grid grid-cols-3 divide-x">
        <div className="px-4 py-3">
          <p className="eyebrow">Gross</p>
          <p className="tabular mt-0.5 text-sm font-semibold">
            {formatCurrency(r.grossOffer, r.currencyCode)}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="eyebrow">Net effective</p>
          <p className="tabular mt-0.5 text-sm font-semibold">
            {formatCurrency(r.netEffectiveValue, r.currencyCode)}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="eyebrow">Fairness</p>
          <p className="tabular mt-0.5 text-sm font-semibold">
            {r.fairness.grade} · {r.fairness.score}
          </p>
        </div>
      </div>
      {!compact && (
        <p className="border-t px-4 py-2 text-xs leading-relaxed text-muted-foreground">
          {r.fairness.verdict}
        </p>
      )}
    </figure>
  );
}
