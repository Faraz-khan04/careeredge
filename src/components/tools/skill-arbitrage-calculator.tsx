"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Calculator, MessageSquarePlus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ROLES, getRole } from "@/data/roles";
import { MARKETS } from "@/data/markets";
import { FX_RATES } from "@/data/markets";
import { partnersForSkills } from "@/data/partners";
import { skillArbitrageInputSchema, type SkillArbitrageInput } from "@/lib/schemas";
import { calculateSkillArbitrage, weeksToComplete } from "@/lib/engines/skill-arbitrage";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useCalculatorStore } from "@/store/use-calculator-store";
import type { SkillArbitrageResult } from "@/types";

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
import { SkillMultiSelect } from "@/components/tools/skill-multi-select";
import { ArbitrageMatrix, QUADRANT_LABEL } from "@/components/tools/arbitrage-matrix";
import { PartnerRail } from "@/components/monetization/partner-card";
import { LeadCaptureModal } from "@/components/monetization/lead-capture-modal";

const ASSET = "skill-roadmap-pdf";

export function SkillArbitrageCalculator() {
  // A landing-page card can hand us a worked example. Anything absent or
  // unrecognised falls back to the standard defaults.
  const searchParams = useSearchParams();
  const seeded = React.useMemo(() => {
    const role = searchParams.get("role");
    const skills = searchParams.get("skills");
    const market = searchParams.get("market");
    const yoe = Number(searchParams.get("yoe"));

    return {
      currentRoleId: ROLES.some((r) => r.id === role) ? role! : "frontend-engineer",
      currentSkillIds: skills ? skills.split(",").filter(Boolean) : ["typescript", "react"],
      marketId: MARKETS.some((m) => m.id === market) ? market! : "austin",
      currencyCode: "USD",
      yearsExperience: Number.isFinite(yoe) && yoe > 0 && yoe < 50 ? yoe : 4,
      weeklyStudyHours: 6,
    };
  }, [searchParams]);

  const [result, setResult] = React.useState<SkillArbitrageResult | null>(null);
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SkillArbitrageInput>({
    resolver: zodResolver(skillArbitrageInputSchema),
    defaultValues: seeded,
  });

  /**
   * Two entry points into the same engine.
   *
   * "experienced" asks what you hold today and ranks what to add. "starting"
   * asks what you're aiming for and ranks the whole stack from nothing —
   * which is the only way the tool is usable by someone with no role yet.
   */
  const [mode, setMode] = React.useState<"experienced" | "starting">(
    searchParams.get("mode") === "starting" ? "starting" : "experienced",
  );

  function switchMode(next: "experienced" | "starting") {
    setMode(next);
    if (next === "starting") {
      // A fresher's stack is whatever they've picked up, not a job history.
      setValue("currentSkillIds", []);
      setValue("yearsExperience", 0);
      setValue("targetRoleId", undefined);
    } else {
      setValue("yearsExperience", 4);
    }
  }

  const starting = mode === "starting";
  const currentRoleId = watch("currentRoleId");
  const weeklyStudyHours = watch("weeklyStudyHours");
  const liveValues = watch();

  /**
   * The engine is a synchronous pure function costing well under a
   * millisecond, so there is nothing to wait for and no reason to make anyone
   * press a button. Results recompute on every change; the small timeout only
   * coalesces bursts while someone drags the slider.
   */
  const liveKey = JSON.stringify(liveValues);
  React.useEffect(() => {
    const parsed = skillArbitrageInputSchema.safeParse(liveValues);
    if (!parsed.success) return;

    const t = setTimeout(() => setResult(calculateSkillArbitrage(parsed.data)), 90);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveKey]);
  const suggestedSkills = getRole(currentRoleId)?.relevantSkills ?? [];

  // Saving is a deliberate act: the live result is already on screen, so this
  // only records the run and persists it so it can be embedded in a post.
  function onSubmit(values: SkillArbitrageInput) {
    const computed = calculateSkillArbitrage(values);
    setResult(computed);
    const stored = recordRun({ kind: "SKILL_ARBITRAGE", input: values, result: computed });
    setRunId(stored.id);
    setServerId(null);
    // Persist server-side so the run can be embedded in a community post.
    void fetch("/api/calculations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "SKILL_ARBITRAGE", input: values, result: computed }),
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

  const topThree = result?.recommendations.slice(0, 3) ?? [];
  const partners = partnersForSkills(topThree.map((r) => r.skillSlug));

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr] lg:items-start">
      {/* ---------------------------------------------------------------- */}
      {/* Inputs                                                            */}
      {/* ---------------------------------------------------------------- */}
      <Card className="lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Your position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div
              role="group"
              aria-label="Where you are"
              className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-secondary/40 p-1"
            >
              {(
                [
                  ["experienced", "I have a role"],
                  ["starting", "I'm starting out"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => switchMode(value)}
                  aria-pressed={mode === value}
                  className={
                    mode === value
                      ? "rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm"
                      : "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currentRoleId">
                {starting ? "Role you're aiming for" : "Current role"}
              </Label>
              <Controller
                control={control}
                name="currentRoleId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="currentRoleId">
                      <SelectValue placeholder="Pick your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.currentRoleId && (
                <p className="text-xs text-destructive">{errors.currentRoleId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>{starting ? "Anything you already know" : "Skills you already have"}</Label>
              {starting && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Leave this empty if you’re at the very beginning — we’ll rank the whole
                  stack from nothing. Add anything from a course or a side project and the
                  ordering adjusts.
                </p>
              )}
              <Controller
                control={control}
                name="currentSkillIds"
                render={({ field }) => (
                  <SkillMultiSelect
                    value={field.value ?? []}
                    onChange={field.onChange}
                    suggested={suggestedSkills}
                    error={errors.currentSkillIds?.message}
                  />
                )}
              />
            </div>

            <div className={starting ? "hidden" : "space-y-1.5"}>
              <Label htmlFor="targetRoleId">Target role</Label>
              <Controller
                control={control}
                name="targetRoleId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? undefined : v)}
                  >
                    <SelectTrigger id="targetRoleId">
                      <SelectValue placeholder="Staying put" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Staying in my current track</SelectItem>
                      {ROLES.filter((r) => r.id !== currentRoleId).map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="marketId">{starting ? "Hiring market" : "Paid in"}</Label>
                <Controller
                  control={control}
                  name="marketId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="marketId">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MARKETS.map((m) => (
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
                <Label htmlFor="currencyCode">Currency</Label>
                <Controller
                  control={control}
                  name="currencyCode"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="currencyCode">
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

            <div className={starting ? "hidden" : "grid grid-cols-1 gap-3"}>
              <div className="space-y-1.5">
                <Label htmlFor="yearsExperience">Years of experience</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  min={0}
                  max={45}
                  {...register("yearsExperience", { valueAsNumber: true })}
                />
                {errors.yearsExperience && (
                  <p className="text-xs text-destructive">{errors.yearsExperience.message}</p>
                )}
              </div>
            </div>

            {/* Dragging this moves every point in the chart, which is the
                fastest way to show what the engine is actually doing. */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="weeklyStudyHours">
                  {starting ? "Hours a week you can study" : "Study hours per week"}
                </Label>
                <span className="tabular font-mono text-sm font-medium text-primary">
                  {weeklyStudyHours ?? 0}h
                </span>
              </div>
              <input
                id="weeklyStudyHours"
                type="range"
                min={1}
                max={30}
                step={1}
                className="range-slider w-full"
                {...register("weeklyStudyHours", { valueAsNumber: true })}
              />
              <div className="flex justify-between font-mono text-[0.6875rem] text-muted-foreground">
                <span>1h — evenings only</span>
                <span>30h — full sprint</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="outline"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              Save this run
              <ArrowRight className="h-4 w-4" />
            </Button>

            {result && (
              <ShareResult
                params={{
                  mode: starting ? "starting" : undefined,
                  role: liveValues.currentRoleId,
                  skills: (liveValues.currentSkillIds ?? []).join(","),
                  market: liveValues.marketId,
                  yoe: liveValues.yearsExperience,
                }}
                label="Copy link to these results"
              />
            )}
            <p className="text-center text-xs text-muted-foreground">
              Results update as you type. Saving keeps the run so you can attach it to a post.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Results                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div ref={resultsRef} className="space-y-8">
        {!result ? (
          <EmptyState />
        ) : (
          <>
            <section className="animate-fade-up space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">
                    Best value for your time
                    <InfoTip term="arbitrageIndex" />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Measured against a base of {formatCurrency(result.baseSalary, result.currencyCode)}
                    {result.targetRoleName ? ` and a move into ${result.targetRoleName}` : ""}.
                  </p>
                </div>
                <Badge variant="lift" className="tabular">
                  {formatCurrency(result.stackedLift.salaryLift, result.currencyCode)} if you take all three
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {topThree.map((rec, i) => (
                  <Card key={rec.skillId} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="tabular text-xs text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <Badge
                          variant={rec.quadrant === "quick-win" ? "lift" : "default"}
                        >
                          {QUADRANT_LABEL[rec.quadrant]}
                        </Badge>
                      </div>
                      <CardTitle className="pt-1">{rec.skillName}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4">
                      <div>
                        <p className="tabular text-2xl font-semibold text-[hsl(var(--lift))]">
                          +{formatCurrency(rec.salaryLift, result.currencyCode)}
                        </p>
                        <p className="tabular text-sm text-muted-foreground">
                          {formatPercent(rec.liftPct)} lift · {rec.effectiveHours} hrs ·{" "}
                          {weeksToComplete(rec.effectiveHours, weeklyStudyHours ?? 6)} weeks
                        </p>
                      </div>

                      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                        {rec.rationale}
                      </p>

                      <div className="flex items-center justify-between border-t pt-3">
                        <span className="text-xs text-muted-foreground">
                          {rec.confidence} confidence
                          <InfoTip term="confidence" />
                        </span>
                        <a
                          href={rec.roadmapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Roadmap
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <ArbitrageMatrix
              recommendations={result.recommendations}
              currencyCode={result.currencyCode}
            />

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Everything else we scored</h3>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr className="text-eyebrow uppercase text-muted-foreground">
                      <th className="px-4 py-2 font-semibold">Skill</th>
                      <th className="px-4 py-2 text-right font-semibold">Lift</th>
                      <th className="px-4 py-2 text-right font-semibold">Hours</th>
                      <th className="px-4 py-2 text-right font-semibold">Index</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.recommendations.slice(3, 12).map((rec) => (
                      <tr key={rec.skillId} className="border-t">
                        <td className="px-4 py-2.5">{rec.skillName}</td>
                        <td className="tabular px-4 py-2.5 text-right text-[hsl(var(--lift))]">
                          +{formatCurrency(rec.salaryLift, result.currencyCode)}
                        </td>
                        <td className="tabular px-4 py-2.5 text-right text-muted-foreground">
                          {rec.effectiveHours}
                        </td>
                        <td className="tabular px-4 py-2.5 text-right font-medium">
                          {Math.round(rec.arbitrageIndex).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <PartnerRail
              offers={partners}
              placement="skill-arbitrage-results"
              heading="Where people learn these"
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
                Download the full roadmap
              </Button>
              <Button variant="secondary" asChild>
                <Link href={`/community/new?embed=${runId ?? ""}&tag=SKILL_ROADMAP`}>
                  <MessageSquarePlus className="h-4 w-4" />
                  Share to community for feedback
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>

      <LeadCaptureModal
        open={leadOpen}
        onOpenChange={setLeadOpen}
        asset={ASSET}
        assetTitle="Your 12-week skill roadmap"
        assetDescription="A week-by-week plan for the three skills above, with the projects that make each one legible on a CV."
        source="SKILL_ARBITRAGE"
        onUnlocked={() => window.open(`/reports/${serverId ?? ""}`, "_blank")}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">Nothing scored yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Tell us the role you hold and what&rsquo;s already in your stack. We&rsquo;ll rank every
        skill worth adding by what it pays per hour of study.
      </p>
    </div>
  );
}
