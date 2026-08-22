"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShareResult } from "@/components/tools/share-result";
import {
  CTC_DEFAULTS,
  calculateCtc,
  type CtcInput,
} from "@/lib/engines/ctc-breakdown";
import { cn } from "@/lib/utils";

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));

/** Indians read salaries in lakhs, so the slider should too. */
const lakhs = (n: number) => `₹${(n / 100_000).toFixed(n % 100_000 === 0 ? 0 : 1)}L`;

export function CtcCalculator() {
  // The JD reader hands off a rupee figure it found in a posting; a shared
  // link carries the whole configuration. Anything absent falls back.
  const searchParams = useSearchParams();
  const seeded = React.useMemo<CtcInput>(() => {
    const num = (key: string, fallback: number, min: number, max: number) => {
      const v = Number(searchParams.get(key));
      return Number.isFinite(v) && v >= min && v <= max ? v : fallback;
    };

    return {
      ...CTC_DEFAULTS,
      ctc: num("ctc", CTC_DEFAULTS.ctc, 100_000, 100_000_000),
      basicPct: num("basic", CTC_DEFAULTS.basicPct, 0.3, 0.6),
      variablePct: num("variable", CTC_DEFAULTS.variablePct, 0, 0.4),
      isMetro: searchParams.get("metro") === "1" ? true : CTC_DEFAULTS.isMetro,
    };
  }, [searchParams]);

  const [input, setInput] = React.useState<CtcInput>(seeded);

  function set<K extends keyof CtcInput>(key: K, value: CtcInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  // Pure and synchronous — no reason to gate this behind a button.
  const result = React.useMemo(() => calculateCtc(input), [input]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start lg:gap-8">
      {/* ---------------------------------------------------------------- */}
      {/* Inputs                                                            */}
      {/* ---------------------------------------------------------------- */}
      <Card className="lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle className="text-base">Your offer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="ctc">Annual CTC</Label>
              <span className="tabular font-mono text-sm font-semibold text-primary">
                {lakhs(input.ctc)}
              </span>
            </div>
            <input
              id="ctc"
              type="range"
              min={300_000}
              max={10_000_000}
              step={50_000}
              value={input.ctc}
              onChange={(e) => set("ctc", Number(e.target.value))}
              className="range-slider mt-3 w-full"
            />
            <div className="mt-1.5 flex justify-between font-mono text-[0.625rem] text-muted-foreground">
              <span>₹3L</span>
              <span>₹1Cr</span>
            </div>
          </div>

          <Slider
            id="basic"
            label="Basic pay share"
            value={input.basicPct}
            display={`${Math.round(input.basicPct * 100)}%`}
            min={0.3}
            max={0.6}
            step={0.01}
            onChange={(v) => set("basicPct", v)}
            help="Check your offer letter. Most Indian employers use 40–50% of CTC."
          />

          <Slider
            id="variable"
            label="Variable / bonus share"
            value={input.variablePct}
            display={`${Math.round(input.variablePct * 100)}%`}
            min={0}
            max={0.4}
            step={0.01}
            onChange={(v) => set("variablePct", v)}
            help="Performance-linked pay. Not guaranteed, so it is excluded from monthly in-hand."
          />

          <div className="space-y-3 border-t border-border pt-5">
            <Toggle
              label="Metro city"
              sub="Mumbai, Delhi, Kolkata or Chennai"
              checked={input.isMetro}
              onChange={(v) => set("isMetro", v)}
            />
            <Toggle
              label="PF on full basic"
              sub="Off means the statutory ₹15,000/month ceiling applies"
              checked={input.pfOnFullBasic}
              onChange={(v) => set("pfOnFullBasic", v)}
            />
            <Toggle
              label="Professional tax applies"
              sub="Off for Delhi, Haryana, UP and a few others"
              checked={input.professionalTaxApplies}
              onChange={(v) => set("professionalTaxApplies", v)}
            />
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground">
              Old regime only
            </p>

            <NumberField
              id="rent"
              label="Monthly rent paid"
              value={input.monthlyRent}
              onChange={(v) => set("monthlyRent", v)}
              help="Drives the HRA exemption. Leave at zero if you do not pay rent."
            />
            <NumberField
              id="s80c"
              label="80C investments (excluding PF)"
              value={input.section80C}
              onChange={(v) => set("section80C", v)}
              help="ELSS, life insurance, PPF, tuition fees. Capped at ₹1.5L including your PF."
            />
            <NumberField
              id="s80d"
              label="Health insurance premium"
              value={input.section80D}
              onChange={(v) => set("section80D", v)}
              help="Section 80D. Capped at ₹25,000 for self and family under 60."
            />
          </div>
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Result                                                            */}
      {/* ---------------------------------------------------------------- */}
      <div className="space-y-5">
        {/* Headline */}
        <div className="crosshairs relative rounded-xl p-6 panel sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
                CTC on the offer letter
              </p>
              <p className="tabular mt-1 font-mono text-xl font-medium text-muted-foreground line-through decoration-white/20">
                {inr(result.ctc)}
              </p>
            </div>

            <ArrowRight className="mb-1.5 hidden h-4 w-4 text-muted-foreground/50 sm:block" aria-hidden="true" />

            <div>
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
                In your account each month
              </p>
              <p className="tabular mt-1 font-mono text-4xl font-semibold tracking-tight">
                {inr(result.monthlyInHand)}
              </p>
            </div>

            <span className="mb-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
              {Math.round(result.inHandPct * 100)}% of CTC
            </span>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            That is {inr(result.annualInHand)} a year in cash.{" "}
            <strong className="font-medium text-foreground">{inr(result.notCash)}</strong> of your
            CTC never reaches your account at all — it goes into provident fund and gratuity.
            {input.variablePct > 0 && (
              <>
                {" "}
                A further{" "}
                <strong className="font-medium text-foreground">
                  {inr(result.ctc * input.variablePct)}
                </strong>{" "}
                is variable pay, which depends on performance and is usually paid annually.
              </>
            )}
          </p>
        </div>

        {/* Regime comparison */}
        <div className="grid gap-4 sm:grid-cols-2">
          <RegimeCard
            title="New regime"
            tax={result.newRegime.totalTax}
            taxable={result.newRegime.taxableIncome}
            best={result.betterRegime === "new"}
          />
          <RegimeCard
            title="Old regime"
            tax={result.oldRegime.totalTax}
            taxable={result.oldRegime.taxableIncome}
            best={result.betterRegime === "old"}
          />
        </div>

        {result.regimeSaving > 500 && (
          <p className="flex gap-2.5 rounded-lg border border-[hsl(var(--lift))]/25 bg-[hsl(var(--lift))]/[0.06] p-4 text-sm leading-relaxed">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--lift))]" aria-hidden="true" />
            <span>
              The <strong className="font-medium">{result.betterRegime} regime</strong> saves you{" "}
              <strong className="font-medium">{inr(result.regimeSaving)}</strong> a year on these
              inputs. You choose your regime at the start of the financial year, so it is worth
              checking before you declare.
            </span>
          </p>
        )}

        {/* Where CTC goes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">What your CTC is made of</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {result.components.map((c) => (
              <details key={c.label} className="group border-t border-border hover:bg-white/[0.02]">
                <summary className="grid cursor-pointer list-none grid-cols-[1fr_4rem_8rem] items-center gap-3 px-6 py-3">
                  <span className="truncate text-sm">{c.label}</span>
                  <span className="tabular text-right font-mono text-[0.6875rem] text-muted-foreground">
                    {((c.amount / result.ctc) * 100).toFixed(1)}%
                  </span>
                  <span className="tabular text-right font-mono text-sm font-medium">
                    {inr(c.amount)}
                  </span>
                </summary>
                <p className="max-w-2xl px-6 pb-4 text-sm leading-relaxed text-muted-foreground">
                  {c.note}
                </p>
              </details>
            ))}
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">What comes out of your salary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {result.deductions.map((d) => (
              <details key={d.label} className="group border-t border-border hover:bg-white/[0.02]">
                <summary className="grid cursor-pointer list-none grid-cols-[1fr_8rem] items-center gap-3 px-6 py-3">
                  <span className="truncate text-sm">{d.label}</span>
                  <span className="tabular text-right font-mono text-sm font-medium text-[hsl(var(--drop))]">
                    −{inr(d.amount)}
                  </span>
                </summary>
                <p className="max-w-2xl px-6 pb-4 text-sm leading-relaxed text-muted-foreground">
                  {d.note}
                </p>
              </details>
            ))}
            <div className="grid grid-cols-[1fr_8rem] items-baseline gap-3 border-t-2 border-foreground/20 px-6 py-4">
              <span className="text-sm font-medium">Annual in-hand</span>
              <span className="tabular text-right font-mono text-lg font-semibold">
                {inr(result.annualInHand)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" asChild>
            <Link href="/community/new?tag=SALARY_TRANSPARENCY">Ask the community about this</Link>
          </Button>
          <ShareResult
            params={{
              ctc: input.ctc,
              basic: input.basicPct,
              variable: input.variablePct,
              metro: input.isMetro ? "1" : "0",
            }}
          />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Slabs and deductions reflect {result.assessmentYear} and are a planning estimate, not a
          filing calculation. Your actual TDS depends on your declarations, your employer&rsquo;s
          structure and your state.{" "}
          <Link href="/methodology" className="text-primary hover:underline">
            How we work this out
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Slider({
  id,
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  help,
}: {
  id: string;
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  help: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="tabular font-mono text-sm font-medium">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-slider mt-3 w-full"
      />
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{help}</p>
    </div>
  );
}

function Toggle({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-md py-1 text-left focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="min-w-0">
        <span className="block text-sm">{label}</span>
        <span className="block text-xs leading-relaxed text-muted-foreground">{sub}</span>
      </span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  help,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  help: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="number"
        min={0}
        step={1000}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="tabular w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none transition-colors focus-visible:border-primary"
      />
      <p className="text-xs leading-relaxed text-muted-foreground">{help}</p>
    </div>
  );
}

function RegimeCard({
  title,
  tax,
  taxable,
  best,
}: {
  title: string;
  tax: number;
  taxable: number;
  best: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-5 panel",
        best && "border-[hsl(var(--lift))]/40 ring-1 ring-[hsl(var(--lift))]/20",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{title}</p>
        {best && (
          <span className="rounded-full bg-[hsl(var(--lift))]/12 px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-[hsl(var(--lift))]">
            Cheaper
          </span>
        )}
      </div>
      <p className="tabular mt-2 font-mono text-2xl font-semibold tracking-tight">{inr(tax)}</p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        tax on {inr(taxable)} taxable
      </p>
    </div>
  );
}
