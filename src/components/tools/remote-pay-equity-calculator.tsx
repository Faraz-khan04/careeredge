"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Globe2, MessageSquarePlus, Scale } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { MARKETS, ANCHOR_MARKETS, FX_RATES, getMarket } from "@/data/markets";
import { ROLES } from "@/data/roles";
import { partnersForCrossBorder } from "@/data/partners";
import {
  remotePayEquityInputSchema,
  type RemotePayEquityInput,
} from "@/lib/schemas";
import { calculateRemotePayEquity } from "@/lib/engines/remote-pay-equity";
import { formatCurrency, formatSigned } from "@/lib/utils";
import { useCalculatorStore } from "@/store/use-calculator-store";
import type { FairnessGrade, RemotePayEquityResult } from "@/types";

import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/ui/info-tip";
import { ShareResult } from "@/components/tools/share-result";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PartnerRail } from "@/components/monetization/partner-card";
import { LeadCaptureModal } from "@/components/monetization/lead-capture-modal";
import { ProGate } from "@/components/monetization/pro-gate";

const ASSET = "negotiation-report-pdf";

const GRADE_TONE: Record<FairnessGrade, string> = {
  A: "text-[hsl(var(--lift))]",
  B: "text-[hsl(var(--lift))]",
  C: "text-[hsl(var(--caution))]",
  D: "text-[hsl(var(--drop))]",
  F: "text-[hsl(var(--drop))]",
};

export function RemotePayEquityCalculator() {
  // A landing-page card can hand us a worked example. Anything absent or
  // unrecognised falls back to the standard defaults.
  const searchParams = useSearchParams();
  const seeded = React.useMemo(() => {
    const offer = Number(searchParams.get("offer"));
    const anchor = searchParams.get("anchor");
    const living = searchParams.get("living");
    const employment = searchParams.get("employment");

    return {
      baseOffer: Number.isFinite(offer) && offer > 0 ? offer : 95_000,
      offerCurrency: "USD",
      anchorMarketId: MARKETS.some((m) => m.id === anchor) ? anchor! : "san-francisco",
      livingMarketId: MARKETS.some((m) => m.id === living) ? living! : "lisbon",
      employment: employment === "CONTRACTOR" ? ("CONTRACTOR" as const) : ("FULL_TIME" as const),
      variableComp: 0,
      roleId: "backend-engineer",
    };
  }, [searchParams]);

  const [result, setResult] = React.useState<RemotePayEquityResult | null>(null);
  const [runId, setRunId] = React.useState<string | null>(null);
  const [serverId, setServerId] = React.useState<string | null>(null);
  const [leadOpen, setLeadOpen] = React.useState(false);

  const recordRun = useCalculatorStore((s) => s.recordRun);
  const hasUnlocked = useCalculatorStore((s) => s.hasUnlocked);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RemotePayEquityInput>({
    resolver: zodResolver(remotePayEquityInputSchema),
    defaultValues: seeded,
  });

  const livingMarketId = watch("livingMarketId");
  const offerCurrency = watch("offerCurrency");
  const employment = watch("employment");
  const livingMarket = getMarket(livingMarketId);

  function onSubmit(values: RemotePayEquityInput) {
    const computed = calculateRemotePayEquity(values);
    setResult(computed);
    const stored = recordRun({ kind: "REMOTE_PAY_EQUITY", input: values, result: computed });
    setRunId(stored.id);
    setServerId(null);
    void fetch("/api/calculations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "REMOTE_PAY_EQUITY", input: values, result: computed }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { id?: string } | null) => {
        if (body?.id) {
          setServerId(body.id);
          useCalculatorStore.getState().attachServerId(stored.id, body.id);
        }
      })
      .catch(() => undefined);

    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const partners = livingMarket
    ? partnersForCrossBorder(livingMarket.countryCode, {
        isContractor: employment === "CONTRACTOR",
        isCurrencyConverted: offerCurrency !== livingMarket.currencyCode,
      })
    : [];

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr] lg:items-start">
      <Card className="lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-primary" />
            The offer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="grid grid-cols-[1fr_6.5rem] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="baseOffer">Base offer (annual)</Label>
                <Input
                  id="baseOffer"
                  type="number"
                  inputMode="numeric"
                  className="tabular"
                  {...register("baseOffer", { valueAsNumber: true })}
                />
                {errors.baseOffer && (
                  <p className="text-xs text-destructive">{errors.baseOffer.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="offerCurrency">Currency</Label>
                <Controller
                  control={control}
                  name="offerCurrency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="offerCurrency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FX_RATES.map((fx) => (
                          <SelectItem key={fx.code} value={fx.code}>
                            {fx.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="variableComp">Bonus and equity, annualised</Label>
              <Input
                id="variableComp"
                type="number"
                inputMode="numeric"
                className="tabular"
                {...register("variableComp", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="anchorMarketId">Employer is anchored in</Label>
              <Controller
                control={control}
                name="anchorMarketId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="anchorMarketId">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANCHOR_MARKETS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="livingMarketId">You live in</Label>
              <Controller
                control={control}
                name="livingMarketId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="livingMarketId">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKETS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.city}
                          {m.country !== "—" ? `, ${m.country}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.livingMarketId && (
                <p className="text-xs text-destructive">{errors.livingMarketId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>How you&rsquo;re engaged</Label>
              <Controller
                control={control}
                name="employment"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ["FULL_TIME", "Employee", "W2 / PEO"],
                        ["CONTRACTOR", "Contractor", "1099 / B2B"],
                      ] as const
                    ).map(([value, label, sub]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        aria-pressed={field.value === value}
                        className={`rounded-md border px-3 py-2 text-left transition-colors ${
                          field.value === value
                            ? "border-primary bg-primary/10"
                            : "border-input hover:bg-accent"
                        }`}
                      >
                        <span className="block text-sm font-medium">{label}</span>
                        <span className="block text-xs text-muted-foreground">{sub}</span>
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="roleId">Role (for the fairness check)</Label>
              <Controller
                control={control}
                name="roleId"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger id="roleId">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              Price this offer
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <div ref={resultsRef} className="space-y-8">
        {!result ? (
          <EmptyState />
        ) : (
          <>
            {/* Hero metric ------------------------------------------------ */}
            <Card className="animate-fade-up overflow-hidden">
              <div className="grid gap-6 p-6 sm:grid-cols-[1.4fr_1fr] sm:items-center">
                <div>
                  <p className="eyebrow">
                    What this buys where you live
                    <InfoTip term="netEffectiveValue" />
                  </p>
                  <p className="tabular mt-2 text-display-1">
                    {formatCurrency(result.netEffectiveValue, result.currencyCode)}
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    That&rsquo;s the anchor-market salary someone would need to live the way this
                    offer lets you live. You take home{" "}
                    <span className="tabular font-medium text-foreground">
                      {formatCurrency(result.netTakeHome, result.currencyCode)}
                    </span>{" "}
                    from a gross of{" "}
                    <span className="tabular">
                      {formatCurrency(result.grossOffer, result.currencyCode)}
                    </span>
                    .
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/40 p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="eyebrow">Offer fairness</span>
                    <span
                      className={`tabular text-4xl font-semibold ${GRADE_TONE[result.fairness.grade]}`}
                    >
                      {result.fairness.grade}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-700"
                      style={{ width: `${result.fairness.score}%` }}
                    />
                  </div>
                  <p className="tabular mt-2 text-xs text-muted-foreground">
                    {result.fairness.score}/100 against a global remote median of{" "}
                    {formatCurrency(result.fairness.globalRemoteMedian, result.currencyCode)}
                  </p>
                </div>
              </div>

              <div className="border-t bg-muted/30 px-6 py-4">
                <p className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <Scale className="mt-0.5 h-4 w-4 shrink-0" />
                  {result.fairness.verdict}
                </p>
              </div>
            </Card>

            {/* Deductions ------------------------------------------------- */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">What comes off the top</h3>
              <div className="divide-y rounded-lg border">
                {result.deductions.map((d) => (
                  <div key={d.label} className="flex gap-4 p-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{d.label}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{d.note}</p>
                    </div>
                    <p className="tabular shrink-0 text-sm font-medium text-[hsl(var(--drop))]">
                      −{formatCurrency(d.amount, result.currencyCode)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Cost of living side by side -------------------------------- */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Where the money goes, both ways</h3>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-eyebrow uppercase text-muted-foreground">
                      <th className="px-4 py-2 text-left font-semibold">Line</th>
                      <th className="px-4 py-2 text-right font-semibold">Anchor market</th>
                      <th className="px-4 py-2 text-right font-semibold">Where you live</th>
                      <th className="px-4 py-2 text-right font-semibold">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.costLines.map((line) => (
                      <tr key={line.label} className="border-t">
                        <td className="px-4 py-2.5">{line.label}</td>
                        <td className="tabular px-4 py-2.5 text-right text-muted-foreground">
                          {formatCurrency(line.anchorAnnual, result.currencyCode)}
                        </td>
                        <td className="tabular px-4 py-2.5 text-right">
                          {formatCurrency(line.localAnnual, result.currencyCode)}
                        </td>
                        <td
                          className={`tabular px-4 py-2.5 text-right font-medium ${
                            line.delta <= 0
                              ? "text-[hsl(var(--lift))]"
                              : "text-[hsl(var(--drop))]"
                          }`}
                        >
                          {formatSigned(line.delta, result.currencyCode)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">Savings potential</td>
                      <td className="px-4 py-2.5" />
                      <td className="tabular px-4 py-2.5 text-right font-medium">
                        {formatCurrency(result.savingsPotentialAnnual, result.currencyCode)}
                      </td>
                      <td className="tabular px-4 py-2.5 text-right text-muted-foreground">
                        {result.savingsRatePct.toFixed(0)}% of net
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Pro-gated percentile band ---------------------------------- */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Local percentile band for this role</h3>
              <ProGate label="P75 and P90 are where counter-offers get anchored. Pro shows the full band.">
                <div className="grid grid-cols-4 divide-x">
                  {(
                    [
                      ["P25", result.percentileBand.p25],
                      ["P50", result.percentileBand.p50],
                      ["P75", result.percentileBand.p75],
                      ["P90", result.percentileBand.p90],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="p-4">
                      <p className="eyebrow">{label}</p>
                      <p className="tabular mt-1 text-lg font-semibold">
                        {formatCurrency(value, result.currencyCode)}
                      </p>
                    </div>
                  ))}
                </div>
              </ProGate>
            </section>

            <PartnerRail
              offers={partners}
              placement="pay-equity-results"
              heading="Handling the cross-border part"
            />

            <div className="flex flex-wrap gap-3 border-t pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  if (hasUnlocked(ASSET)) {
                    window.open(`/reports/${serverId ?? ""}`, "_blank");
                  } else {
                    setLeadOpen(true);
                  }
                }}
              >
                Get the negotiation report
              </Button>
              <Button variant="secondary" asChild>
                <Link href={`/community/new?embed=${runId ?? ""}&tag=OFFER_REVIEW`}>
                  <MessageSquarePlus className="h-4 w-4" />
                  Get community review on this offer
                </Link>
              </Button>
              <ShareResult
                params={{
                  offer: seeded.baseOffer,
                  anchor: watch("anchorMarketId"),
                  living: watch("livingMarketId"),
                  employment: watch("employment"),
                }}
              />
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Tax figures are blended effective rates for planning, not filing. Cost indices are
              city medians and won&rsquo;t match any one household. Check anything material with an
              accountant in your jurisdiction.
            </p>
          </>
        )}
      </div>

      <LeadCaptureModal
        open={leadOpen}
        onOpenChange={setLeadOpen}
        asset={ASSET}
        assetTitle="Your negotiation report"
        assetDescription="A PDF with the itemised tax schedule, the anchor-market comparison, and the three counter-offer positions this run supports."
        source="REMOTE_PAY_EQUITY"
        onUnlocked={() => window.open(`/reports/${serverId ?? ""}`, "_blank")}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
        <Scale className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">No offer priced yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Enter the number, where it comes from, and where you live. We&rsquo;ll show what it&rsquo;s
        actually worth once tax, structure, and local costs are taken out.
      </p>
    </div>
  );
}
