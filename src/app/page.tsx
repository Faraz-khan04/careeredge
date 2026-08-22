import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SkillRadarCanvas } from "@/components/visuals/skill-radar-canvas";
import { CashflowSimulator } from "@/components/tools/cashflow-simulator";
import { TiltCard } from "@/components/motion/tilt-card";
import { CountUp, Reveal } from "@/components/motion/reveal";
import { calculateSkillArbitrage } from "@/lib/engines/skill-arbitrage";
import { calculateRemotePayEquity } from "@/lib/engines/remote-pay-equity";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { MARKETS } from "@/data/markets";
import { SKILLS } from "@/data/skills";
import { ROLES } from "@/data/roles";

const ARBITRAGE_DEMO = {
  currentRoleId: "frontend-engineer",
  currentSkillIds: ["typescript", "react", "tailwind"],
  marketId: "austin",
  currencyCode: "USD",
  yearsExperience: 5,
  weeklyStudyHours: 6,
} as const;

const EQUITY_DEMO = {
  baseOffer: 95_000,
  offerCurrency: "USD",
  anchorMarketId: "san-francisco",
  livingMarketId: "lisbon",
  employment: "CONTRACTOR",
  variableComp: 0,
  roleId: "frontend-engineer",
} as const;

const heroArbitrage = calculateSkillArbitrage({
  ...ARBITRAGE_DEMO,
  currentSkillIds: [...ARBITRAGE_DEMO.currentSkillIds],
});

const heroEquity = calculateRemotePayEquity({ ...EQUITY_DEMO });

const ARBITRAGE_HREF =
  `/tools/skill-arbitrage?role=${ARBITRAGE_DEMO.currentRoleId}` +
  `&skills=${ARBITRAGE_DEMO.currentSkillIds.join(",")}` +
  `&market=${ARBITRAGE_DEMO.marketId}&yoe=${ARBITRAGE_DEMO.yearsExperience}`;

const EQUITY_HREF =
  `/tools/remote-pay-equity?offer=${EQUITY_DEMO.baseOffer}` +
  `&anchor=${EQUITY_DEMO.anchorMarketId}&living=${EQUITY_DEMO.livingMarketId}` +
  `&employment=${EQUITY_DEMO.employment}`;

export default function HomePage() {
  const top = heroArbitrage.recommendations.slice(0, 3);
  const best = top[0];

  return (
    <>
      {/* ================================================================ *
       * Hero
       * ================================================================ */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">

        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
                  <span className="radar" aria-hidden="true" />
                  Labour market intelligence
                  <span className="text-muted-foreground/40">{"//"}</span>
                  <span className="text-[hsl(var(--signal))]">real-time</span>
                </span>
              </Reveal>

              <Reveal delayMs={80}>
                <h1 className="mt-6 font-sans text-display-1 font-semibold tracking-tight text-balance">
                  Every career decision is a price
                  <span className="block text-muted-foreground">
                    you either negotiated or accepted.
                  </span>
                </h1>
              </Reveal>

              <Reveal delayMs={140}>
                <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
                  We answer two of them with real numbers: which skill is worth learning next for
                  the hours you have, and what a job offer in another country is actually worth
                  where you live.
                </p>
              </Reveal>

              <Reveal delayMs={200}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button size="lg" className="border-beam aura" asChild>
                    <Link href="/tools/skill-arbitrage">
                      Score a skill
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="panel" asChild>
                    <Link href="/tools/remote-pay-equity">Check an offer</Link>
                  </Button>
                </div>
              </Reveal>

              <Reveal delayMs={260}>
                <dl className="mt-10 flex items-center divide-x divide-white/[0.07] rounded-xl border border-white/[0.08] bg-card/40 p-4 backdrop-blur-md">
                  <Stat
                    label="Top lift found"
                    value={best?.salaryLift ?? 0}
                    prefix="+"
                    currency={heroArbitrage.currencyCode}
                    accent="text-[hsl(var(--lift))]"
                  />
                  <Stat label="Study hours" value={best?.effectiveHours ?? 0} suffix="h" />
                  <Stat label="Markets priced" value={MARKETS.length} />
                </dl>
              </Reveal>
            </div>

            <Reveal delayMs={160}>
              <div className="crosshairs relative rounded-xl p-4 panel">
                <div className="mb-3 flex items-center justify-between px-1">
                  <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Effort against return
                  </p>
                  <p className="font-mono text-[0.6875rem] text-muted-foreground/60">
                    {heroArbitrage.recommendations.length} scored
                  </p>
                </div>
                <SkillRadarCanvas
                  recommendations={[...heroArbitrage.recommendations]}
                  currencyCode={heroArbitrage.currencyCode}
                />
              </div>
            </Reveal>
          </div>
        </div>

        {/* Ticker */}
        <div className="marquee-mask relative border-t border-white/[0.06] py-3">
          <div className="marquee gap-8">
            {[...MARKETS, ...MARKETS].map((m, i) => (
              <span
                key={`${m.id}-${i}`}
                className="flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground"
              >
                <span className="h-1 w-1 rounded-full bg-[hsl(var(--glow))]/70" aria-hidden="true" />
                {m.city}
                <span className="text-muted-foreground/50">{m.currencyCode}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ *
       * Proof
       * ================================================================ */}
      <section className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-24 pt-24 sm:pt-28">
        <Reveal>
          <h2 className="text-display-2 font-semibold tracking-tight">Two questions, priced.</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Both worked examples are computed by the same engines the tools use — open either and
            the calculator arrives already filled in.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {best && (
            <Reveal delayMs={60}>
              <TiltCard className="h-full rounded-xl">
              <ProofCard
                href={ARBITRAGE_HREF}
                eyebrow="Frontend engineer · Austin · 5 YOE"
                value={best.salaryLift}
                prefix="+"
                currency={heroArbitrage.currencyCode}
                valueClassName="text-[hsl(var(--lift))]"
                tag={`High ROI · ${formatPercent(best.liftPct)}`}
                tagClassName="border-[hsl(var(--lift))]/25 bg-[hsl(var(--lift))]/10 text-[hsl(var(--lift))]"
                cta="Check skill ROI"
              >
                Adding <strong className="font-medium text-foreground">{best.skillName}</strong> to a
                TypeScript and React stack — {best.effectiveHours} hours of study on a base of{" "}
                {formatCurrency(heroArbitrage.baseSalary, heroArbitrage.currencyCode)}.
              </ProofCard>
              </TiltCard>
            </Reveal>
          )}

          <Reveal delayMs={130}>
            <TiltCard className="h-full rounded-xl">
            <ProofCard
              href={EQUITY_HREF}
              eyebrow="$95k SF contract · living in Lisbon"
              value={heroEquity.netEffectiveValue}
              currency={heroEquity.currencyCode}
              valueClassName="text-foreground"
              tag={`Fairness ${heroEquity.fairness.grade}`}
              tagClassName="border-[hsl(var(--drop))]/25 bg-[hsl(var(--drop))]/10 text-[hsl(var(--drop))]"
              cta="Check COLA-adjusted value"
            >
              Net take-home buys what {formatCurrency(heroEquity.netEffectiveValue, heroEquity.currencyCode)}{" "}
              would buy in San Francisco — Lisbon costs less, so the money goes further there.
            </ProofCard>
            </TiltCard>
          </Reveal>
        </div>

        <Reveal delayMs={80}>
          <div className="mt-5">
            <CashflowSimulator />
          </div>
        </Reveal>

        <Reveal>
          <p className="mt-8 text-center font-mono text-xs text-muted-foreground">
            {SKILLS.length} skills · {ROLES.length} roles · {MARKETS.length} markets · every figure
            computed live, nothing stored
          </p>
        </Reveal>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Stat({
  label,
  value,
  currency,
  prefix,
  suffix,
  accent,
}: {
  label: string;
  value: number;
  currency?: string;
  prefix?: string;
  suffix?: string;
  accent?: string;
}) {
  return (
    <div className="flex-1 px-4 first:pl-1 last:pr-1">
      <dd className={`tabular font-mono text-xl font-medium tracking-tight ${accent ?? ""}`}>
        <CountUp value={value} currency={currency} prefix={prefix} suffix={suffix} />
      </dd>
      <dt className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
    </div>
  );
}

function ProofCard({
  href,
  eyebrow,
  value,
  currency,
  prefix,
  valueClassName,
  tag,
  tagClassName,
  cta,
  children,
}: {
  href: string;
  eyebrow: string;
  value: number;
  currency?: string;
  prefix?: string;
  valueClassName: string;
  tag: string;
  tagClassName: string;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="surface-hover group block h-full rounded-xl p-6 panel hover:border-white/20"
    >
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground">
        {eyebrow}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <p className={`tabular font-mono text-4xl font-medium tracking-tight ${valueClassName}`}>
          <CountUp value={value} currency={currency} prefix={prefix} />
        </p>
        <span className={`rounded-full border px-2.5 py-0.5 font-mono text-xs ${tagClassName}`}>
          {tag}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</p>

      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        {cta}
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
