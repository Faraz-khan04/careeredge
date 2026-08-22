import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { RemotePayEquityResult, SkillArbitrageResult } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your report",
  robots: { index: false, follow: false },
};

/**
 * The gated asset. Rendered as a print-optimised page rather than a generated
 * binary: it opens instantly, stays accessible, and the browser's own
 * print-to-PDF produces the file. Swap in a Playwright or React-PDF renderer
 * if you need the PDF attached to an email instead.
 */
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const record = await prisma.calculationHistory.findUnique({
    where: { id },
    select: { type: true, result: true, createdAt: true },
  });

  if (!record) notFound();

  return (
    <div className="container max-w-2xl py-12 print:py-0">
      <header className="mb-8 border-b pb-6">
        <p className="eyebrow">CareerEdge report</p>
        <h1 className="mt-2 text-display-2">
          {record.type === "SKILL_ARBITRAGE" ? "Skill roadmap" : "Offer negotiation brief"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Generated {record.createdAt.toLocaleDateString("en-US", { dateStyle: "long" })}
        </p>
      </header>

      {record.type === "SKILL_ARBITRAGE" ? (
        <SkillReport result={record.result as unknown as SkillArbitrageResult} />
      ) : (
        <EquityReport result={record.result as unknown as RemotePayEquityResult} />
      )}

      <p className="mt-12 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
        Figures are modelled medians for planning. They are not an offer, a guarantee, or tax
        advice. Print this page to save it as a PDF.
      </p>
    </div>
  );
}

function SkillReport({ result }: { result: SkillArbitrageResult }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold">The plan</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Working through the three skills below adds an estimated{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(result.stackedLift.salaryLift, result.currencyCode)}
          </span>{" "}
          ({formatPercent(result.stackedLift.liftPct)}) over{" "}
          {result.stackedLift.totalHours} hours of study, measured against a base of{" "}
          {formatCurrency(result.baseSalary, result.currencyCode)}.
        </p>
      </section>

      <ol className="space-y-6">
        {result.recommendations.slice(0, 3).map((rec, i) => (
          <li key={rec.skillId} className="border-l-2 border-primary pl-4">
            <p className="eyebrow">Week {i * 4 + 1}–{i * 4 + 4}</p>
            <h3 className="mt-1 text-base font-semibold">{rec.skillName}</h3>
            <p className="tabular mt-1 text-sm text-[hsl(var(--lift))]">
              +{formatCurrency(rec.salaryLift, result.currencyCode)} · {rec.effectiveHours} hrs
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{rec.rationale}</p>
            <p className="mt-2 text-sm">
              Roadmap:{" "}
              <a href={rec.roadmapUrl} className="text-primary underline">
                {rec.roadmapUrl}
              </a>
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function EquityReport({ result }: { result: RemotePayEquityResult }) {
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-3 gap-4">
        {(
          [
            ["Gross offer", result.grossOffer],
            ["Net take-home", result.netTakeHome],
            ["Net effective value", result.netEffectiveValue],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-lg border p-4">
            <p className="eyebrow">{label}</p>
            <p className="tabular mt-1 text-lg font-semibold">
              {formatCurrency(value, result.currencyCode)}
            </p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Where it goes</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {result.deductions.map((d) => (
              <tr key={d.label} className="border-b">
                <td className="py-2 pr-4 align-top">
                  <span className="font-medium">{d.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{d.note}</span>
                </td>
                <td className="tabular py-2 text-right align-top text-[hsl(var(--drop))]">
                  −{formatCurrency(d.amount, result.currencyCode)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Your negotiating position</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {result.fairness.verdict}
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="tabular">
            Global remote median for this role:{" "}
            {formatCurrency(result.fairness.globalRemoteMedian, result.currencyCode)}
          </li>
          <li className="tabular">
            Local market median:{" "}
            {formatCurrency(result.fairness.localMarketMedian, result.currencyCode)}
          </li>
          <li className="tabular">
            P75 anchor for a counter:{" "}
            {formatCurrency(result.percentileBand.p75, result.currencyCode)}
          </li>
        </ul>
      </section>
    </div>
  );
}
