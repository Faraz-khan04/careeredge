"use client";

import * as React from "react";
import { ArrowRight, Flame, Landmark, PiggyBank, Plane, Repeat } from "lucide-react";

import { calculateRemotePayEquity } from "@/lib/engines/remote-pay-equity";
import { formatCurrency } from "@/lib/utils";

/**
 * Cashflow erosion simulator.
 *
 * Drag the contract value and every deduction recalculates through the real
 * engine — nothing here is interpolated or faked. The engine is synchronous
 * and pure, so this costs nothing to run on every frame of a drag.
 */

const TONE: Record<string, string> = {
  "Currency conversion spread": "#D9A441",
  "Self-employment / social contributions": "#E5484D",
  "Forfeited statutory benefits": "#D6555C",
  "Unpaid leave": "#B4535C",
  "Income tax (blended effective)": "#E8833A",
};

const ICON: Record<string, React.ReactNode> = {
  "Currency conversion spread": <Repeat className="h-3 w-3" />,
  "Self-employment / social contributions": <Flame className="h-3 w-3" />,
  "Forfeited statutory benefits": <PiggyBank className="h-3 w-3" />,
  "Unpaid leave": <Plane className="h-3 w-3" />,
  "Income tax (blended effective)": <Landmark className="h-3 w-3" />,
};

export function CashflowSimulator() {
  const [offer, setOffer] = React.useState(95_000);
  const [active, setActive] = React.useState<string | null>(null);

  const result = React.useMemo(
    () =>
      calculateRemotePayEquity({
        baseOffer: offer,
        offerCurrency: "USD",
        anchorMarketId: "san-francisco",
        livingMarketId: "lisbon",
        employment: "CONTRACTOR",
        variableComp: 0,
        roleId: "frontend-engineer",
      }),
    [offer],
  );

  const gross = result.grossOffer;
  const netPct = (result.netTakeHome / gross) * 100;
  const friction = 100 - netPct;

  const segments = [
    { label: "Net take-home", amount: result.netTakeHome, tone: "hsl(var(--lift))" },
    ...result.deductions.map((d) => ({
      label: d.label,
      amount: d.amount,
      tone: TONE[d.label] ?? "#E5484D",
    })),
  ].map((s) => ({ ...s, pct: (s.amount / gross) * 100 }));

  return (
    <div className="crosshairs relative rounded-xl p-6 panel sm:p-8">
      {/* ------------------------------------------------------------ */}
      {/* Control                                                       */}
      {/* ------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 rounded-lg border border-white/[0.07] bg-white/[0.02] p-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="shrink-0">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
            Base offer
          </p>
          <p className="tabular mt-0.5 font-mono text-xl font-semibold tracking-tight">
            ${offer.toLocaleString("en-US")}{" "}
            <span className="text-sm font-normal text-muted-foreground">USD</span>
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={50_000}
            max={200_000}
            step={1_000}
            value={offer}
            onChange={(e) => setOffer(Number(e.target.value))}
            aria-label="Base contract value in US dollars"
            className="range-slider w-full"
          />
          <div className="mt-1.5 flex justify-between font-mono text-[0.625rem] text-muted-foreground">
            <span>$50k</span>
            <span>$200k</span>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-center font-mono text-[0.6875rem] text-muted-foreground">
          SF anchor → Lisbon · 1099 contractor
        </span>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Bridge                                                        */}
      {/* ------------------------------------------------------------ */}
      <div className="mt-7 flex flex-wrap items-end gap-x-8 gap-y-4">
        <div>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
            Gross contract
          </p>
          <p className="tabular mt-1 font-mono text-xl font-medium text-muted-foreground line-through decoration-white/20">
            {formatCurrency(gross, result.currencyCode)}
          </p>
        </div>

        <ArrowRight className="mb-1.5 hidden h-4 w-4 text-muted-foreground/50 sm:block" aria-hidden="true" />

        <div>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
            True local baseline
          </p>
          <p className="tabular mt-1 font-mono text-4xl font-semibold tracking-tight">
            {formatCurrency(result.netTakeHome, result.currencyCode)}
          </p>
        </div>

        <span className="mb-2 rounded-full border border-[hsl(var(--drop))]/30 bg-[hsl(var(--drop))]/10 px-3 py-1 font-mono text-xs text-[hsl(var(--drop))]">
          −{friction.toFixed(1)}% real friction
        </span>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Waterfall                                                     */}
      {/* ------------------------------------------------------------ */}
      <div className="mt-7">
        <div
          role="img"
          aria-label={segments
            .map((seg) => `${seg.label} ${seg.pct.toFixed(1)} percent`)
            .join(", ")}
          className="beam flex h-3.5 w-full overflow-hidden rounded-full bg-white/[0.04]"
        >
          {segments.map((seg) => (
            <div
              key={seg.label}
              onMouseEnter={() => setActive(seg.label)}
              onMouseLeave={() => setActive(null)}
              className="segment h-full transition-[width] duration-300 ease-out"
              style={{
                width: `${seg.pct}%`,
                backgroundColor: seg.tone,
                filter: active && active !== seg.label ? "saturate(0.35) brightness(0.7)" : undefined,
              }}
              title={`${seg.label} — ${seg.pct.toFixed(1)}%`}
            />
          ))}
        </div>

        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {segments.map((seg) => (
            <li
              key={seg.label}
              onMouseEnter={() => setActive(seg.label)}
              onMouseLeave={() => setActive(null)}
              className="flex cursor-default items-center gap-2 transition-opacity"
              style={{ opacity: active && active !== seg.label ? 0.4 : 1 }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ backgroundColor: seg.tone }}
                aria-hidden="true"
              />
              <span className="text-xs text-muted-foreground">{seg.label}</span>
              <span className="tabular font-mono text-xs font-medium">{seg.pct.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Ledger                                                        */}
      {/* ------------------------------------------------------------ */}
      <div className="mt-8 border-t border-white/[0.06]">
        {result.deductions.map((d) => {
          const dim = active !== null && active !== d.label;
          return (
            <details
              key={d.label}
              onMouseEnter={() => setActive(d.label)}
              onMouseLeave={() => setActive(null)}
              className="group border-b border-white/[0.06] transition-colors hover:bg-white/[0.02]"
              style={{ opacity: dim ? 0.45 : 1 }}
            >
              <summary className="grid cursor-pointer list-none grid-cols-[2rem_1fr_4rem_7.5rem] items-center gap-3 py-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.04]"
                  style={{ color: TONE[d.label] ?? "#E5484D" }}
                >
                  {ICON[d.label] ?? <Flame className="h-3.5 w-3.5" />}
                </span>
                <span className="truncate text-sm">{d.label}</span>
                <span className="tabular text-right font-mono text-[0.6875rem] text-muted-foreground">
                  {((d.amount / gross) * 100).toFixed(1)}%
                </span>
                <span className="tabular text-right font-mono text-sm font-medium text-[hsl(var(--drop))]">
                  −{formatCurrency(d.amount, result.currencyCode)}
                </span>
              </summary>
              <p className="max-w-2xl pb-4 pl-[2.75rem] text-sm leading-relaxed text-muted-foreground">
                {d.note}
              </p>
            </details>
          );
        })}

        <div className="grid grid-cols-[2rem_1fr_4rem_7.5rem] items-baseline gap-3 py-4">
          <span />
          <span className="text-sm font-medium">Net take-home</span>
          <span className="tabular text-right font-mono text-[0.6875rem] text-muted-foreground">
            {netPct.toFixed(1)}%
          </span>
          <span className="tabular text-right font-mono text-lg font-semibold">
            {formatCurrency(result.netTakeHome, result.currencyCode)}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Every figure recalculates through the same engine the calculator uses. Nothing on this bar
        is interpolated.
      </p>
    </div>
  );
}
