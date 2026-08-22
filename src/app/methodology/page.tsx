import type { Metadata } from "next";
import Link from "next/link";

import { SKILL_ARBITRAGE_ENGINE_VERSION } from "@/lib/engines/skill-arbitrage";
import { PAY_EQUITY_ENGINE_VERSION } from "@/lib/engines/remote-pay-equity";
import { JD_PARSER_VERSION } from "@/lib/engines/jd-parser";
import { CTC_ENGINE_VERSION } from "@/lib/engines/ctc-breakdown";
import { ASSESSMENT_YEAR } from "@/data/india-tax";
import { MARKETS, FX_SPREAD_PCT } from "@/data/markets";
import { SKILLS } from "@/data/skills";
import { ROLES } from "@/data/roles";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "The formulas behind every number on CareerEdge, the data they use, and what the models cannot see.",
};

export default function MethodologyPage() {
  return (
    <div className="container max-w-3xl scroll-mt-24 pb-24 pt-16">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
        Methodology
      </p>
      <h1 className="mt-3 text-display-2 font-semibold tracking-tight">
        How these numbers are produced
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
        Every figure on this site comes from a formula you can read below, applied to a dataset
        described below. If a number here informs a decision about your income, you should be able
        to check our reasoning &mdash; so here it is, including the parts where the model is weakest.
      </p>

      {/* ============================================================== */}
      <Section title="Skill ROI" version={SKILL_ARBITRAGE_ENGINE_VERSION}>
        <p>
          The question is not which skill pays most. It is which skill pays most{" "}
          <em>per hour you spend learning it</em>. A skill worth 15% that takes 400 hours is a worse
          use of a year than one worth 6% that takes 40.
        </p>

        <Formula>arbitrage index = (base salary &times; lift %) &divide; effective hours &times; 100</Formula>

        <p>Three adjustments sit behind those two inputs.</p>

        <Term label="Scarcity multiplier">
          A skill listed by most of the candidate pool is table stakes, not a differentiator.
          Demand divided by supply scales the raw lift, which is why a widely-held skill scores
          lower here than its headline salary correlation suggests.
        </Term>

        <Term label="Prerequisite factor">
          Published learning estimates assume you start from nothing. If your existing stack already
          covers the dependencies, the runway is shorter, and effective hours drop accordingly.
        </Term>

        <Term label="Seniority curves">
          Learning speed and pay conversion are modelled separately. Senior engineers absorb a new
          tool faster but convert it into salary more slowly, because their pay is already
          anchored to scope rather than tooling.
        </Term>

        <p>
          When several skills are stacked, lift decays across them &mdash; the second and third
          skills contribute 78% and 60% of their standalone value, because employers do not pay
          three separate premiums for one person.
        </p>
      </Section>

      {/* ============================================================== */}
      <Section title="Cost-of-living adjusted pay (COLA)" version={PAY_EQUITY_ENGINE_VERSION}>
        <p>
          A cross-border offer is not worth its headline number. Deductions apply in a fixed order,
          because each one operates on what the previous one left.
        </p>

        <ol className="my-4 space-y-2.5 text-muted-foreground">
          {[
            ["FX spread", `Retail conversion cost, modelled at ${(FX_SPREAD_PCT * 100).toFixed(1)}% of the converted amount.`],
            ["Self-employment tax", "Contractors only. You carry both halves of the social contribution."],
            ["Forfeited statutory benefits", "Contractors only. Health cover, pension match and insurance an employer would otherwise fund."],
            ["Unpaid leave", "Contractors only. Around 20 days plus public holidays, funded from the same rate — 7.7% of the year."],
            ["Income tax", "A blended effective rate for the living market, not a filing calculation."],
          ].map(([label, detail], i) => (
            <li key={label} className="flex gap-3">
              <span className="tabular mt-0.5 shrink-0 font-mono text-xs text-muted-foreground/60">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <strong className="font-medium text-foreground">{label}.</strong> {detail}
              </span>
            </li>
          ))}
        </ol>

        <Formula>
          net effective value = net take-home &times; (anchor cost base &divide; living cost base)
        </Formula>

        <p>
          That last step is the one people misread most often, so it is worth stating plainly: the
          headline figure is <strong className="font-medium text-foreground">not money</strong>. It
          answers &ldquo;what would someone in the anchor city need to earn to live the way this
          offer lets you live?&rdquo; The money that reaches your account is the net take-home
          figure, which is always lower.
        </p>

        <p>
          The fairness grade scores the ratio of that value against the global remote median, on a
          curve where parity lands around a C. It is a comparison, not a judgement about whether an
          employer is behaving well.
        </p>
      </Section>

      {/* ============================================================== */}
      <Section title="CTC to in-hand" version={CTC_ENGINE_VERSION}>
        <p>
          An Indian CTC is a budget, not a salary. Two parts of it never reach your bank account:
          the employer&rsquo;s provident fund contribution and the gratuity provision, which is set
          aside against a payout you only receive after five years of service. Variable pay is a
          third: it is real money, but it depends on performance and is usually paid annually, so
          it is excluded from the monthly figure rather than averaged into it.
        </p>

        <Formula>
          in-hand = basic + HRA + special allowance &minus; your PF &minus; tax &minus; professional tax
        </Formula>

        <p>
          Both tax regimes are computed in full and the cheaper one is applied. The old regime
          allows an HRA exemption &mdash; the lowest of actual HRA, rent minus 10% of basic, or 50%
          of basic in a metro and 40% elsewhere &mdash; along with sections 80C and 80D. Your own PF
          contribution counts towards the 80C ceiling before any additional investment does, which
          people frequently miss.
        </p>

        <p>
          Slabs, the standard deduction and the section 87A rebate reflect{" "}
          <strong className="font-medium text-foreground">{ASSESSMENT_YEAR}</strong>. These change
          in most Union Budgets, so check the year shown before relying on a figure. Professional
          tax is a state levy and several states do not charge it at all.
        </p>
      </Section>

      {/* ============================================================== */}
      <Section title="Job description simplifier" version={JD_PARSER_VERSION}>
        <p>
          No language model is involved. Every flag corresponds to a phrase literally present in
          the text, which is why the tool shows you the matched excerpt in every case &mdash; you can
          overrule it, and often should. Counted observations, like a junior title paired with a
          multi-year requirement, come from arithmetic over the posting rather than pattern matching.
        </p>
        <p>
          The clarity score starts from what a posting discloses and deducts for what it withholds.
          It measures the writing, not the employer. Plenty of good companies write careless job
          postings.
        </p>
      </Section>

      {/* ============================================================== */}
      <Section title="The data">
        <dl className="my-4 grid grid-cols-3 gap-4 rounded-xl border border-white/[0.08] bg-card/40 p-4">
          <Stat value={ROLES.length} label="Roles" />
          <Stat value={SKILLS.length} label="Skills" />
          <Stat value={MARKETS.length} label="Markets" />
        </dl>

        <p>
          Salary bands are modelled medians blended from public compensation datasets, government
          labour statistics and cost-of-living indices, reflecting 2025 conditions. Cost indices are
          city-level, with New York set to 100. Tax lines are blended effective rates for planning,
          not filing calculations.
        </p>

        <p>
          <strong className="font-medium text-foreground">A note on India.</strong> Twelve of these
          markets are Indian cities, and the contractor model fits them least well. It was built
          around US and European practice, where a contractor loses employer-funded social
          contributions. In India the picture is different &mdash; there is no employer PF
          contribution to lose, but GST registration, advance tax and professional tax apply
          instead. Treat the employee figures as sound and the contractor deductions for Indian
          cities as a rough upper bound until the model is rebuilt for them.
        </p>

        <p>
          Sample sizes vary by skill, which is what the confidence label on each recommendation
          reports. High confidence means the underlying sample is large enough that the median is
          stable; medium and low mean treat the figure as directional.
        </p>
      </Section>

      {/* ============================================================== */}
      <Section title="What these models cannot see">
        <p>
          This is the section worth reading before you act on anything above.
        </p>

        <ul className="my-4 space-y-3">
          {[
            "Your negotiation. The single largest variable in what you actually earn is not modelled at all.",
            "Your specific employer. Company-level pay varies far more than market-level pay, and we work at market level.",
            "Equity, bonuses and long-term incentives, which for senior roles frequently exceed base salary.",
            "Whether you will enjoy the work. A skill with a high arbitrage index you resent learning is a bad trade at any price.",
            "Visa status, residency rules and treaty positions, all of which can change a cross-border calculation entirely.",
            "Your local tax situation. Deductions, allowances and filing status move effective rates well away from a blended average.",
          ].map((limit) => (
            <li key={limit} className="flex gap-3 text-muted-foreground">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--caution))]" aria-hidden="true" />
              {limit}
            </li>
          ))}
        </ul>

        <p>
          These figures are planning aids. They are not financial advice, not an offer, and not a
          substitute for an accountant in your jurisdiction.
        </p>
      </Section>

      <div className="mt-12 flex flex-wrap gap-4 border-t border-white/[0.06] pt-8 text-sm">
        <Link href="/tools/skill-arbitrage" className="text-primary hover:underline">
          Skill ROI &rarr;
        </Link>
        <Link href="/tools/remote-pay-equity" className="text-primary hover:underline">
          COLA pay &rarr;
        </Link>
        <Link href="/tools/ctc-calculator" className="text-primary hover:underline">
          CTC to in-hand &rarr;
        </Link>
        <Link href="/tools/jd-simplifier" className="text-primary hover:underline">
          JD simplifier &rarr;
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Section({
  title,
  version,
  children,
}: {
  title: string;
  version?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 border-t border-white/[0.06] pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {version && (
          <span className="font-mono text-[0.6875rem] text-muted-foreground">
            engine v{version}
          </span>
        )}
      </div>
      <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <p className="my-5 overflow-x-auto rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 font-mono text-sm text-foreground">
      {children}
    </p>
  );
}

function Term({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p>
      <strong className="font-medium text-foreground">{label}. </strong>
      {children}
    </p>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dd className="tabular font-mono text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </dd>
      <dt className="mt-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
    </div>
  );
}
