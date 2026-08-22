import { getRole } from "@/data/roles";
import {
  getMarket,
  toUsd,
  fromUsd,
  currencySymbol,
  FX_SPREAD_PCT,
} from "@/data/markets";
import type { RemotePayEquityInput } from "@/lib/schemas";
import type {
  CostLine,
  EquityDeduction,
  FairnessGrade,
  RemotePayEquityResult,
} from "@/types";

export const PAY_EQUITY_ENGINE_VERSION = "1.0.0";

/** Share of post-housing, post-food income treated as non-discretionary. */
const ESSENTIALS_SHARE = 0.28;
/** Paid leave a contractor funds themselves, as a share of gross. */
const UNPAID_LEAVE_SHARE = 0.077; // ~20 days + statutory holidays

function gradeFor(score: number): FairnessGrade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function verdictFor(grade: FairnessGrade, ratio: number): string {
  const pct = Math.round(Math.abs(1 - ratio) * 100);
  switch (grade) {
    case "A":
      return `This offer clears the global remote median for the role by about ${pct}%. There's little left on the table.`;
    case "B":
      return `Slightly above the global remote median. A ${pct}% ask is defensible with a competing offer in hand.`;
    case "C":
      return `Roughly at the global remote median, which means it's priced to your location rather than your output. Anchor the counter to the employer's home market.`;
    case "D":
      return `Below the global remote median by about ${pct}%. This is location arbitrage running in the employer's favour.`;
    case "F":
      return `Well below the global remote median — around ${pct}% short. Treat the anchor-market rate as your counter, not this number.`;
  }
}

export function calculateRemotePayEquity(
  input: RemotePayEquityInput,
): RemotePayEquityResult {
  const anchor = getMarket(input.anchorMarketId);
  const living = getMarket(input.livingMarketId);
  if (!anchor || !living) {
    throw new Error("Unknown market id — reference data is out of sync.");
  }

  const displayCurrency = living.currencyCode;
  const symbol = currencySymbol(displayCurrency);

  // Everything is computed in USD, then presented in the living currency.
  const grossUsd =
    toUsd(input.baseOffer, input.offerCurrency) +
    toUsd(input.variableComp, input.offerCurrency);

  // --- Deductions ----------------------------------------------------------
  const deductions: EquityDeduction[] = [];
  let remainingUsd = grossUsd;

  const crossBorder = input.offerCurrency !== displayCurrency;
  if (crossBorder) {
    const spread = grossUsd * FX_SPREAD_PCT;
    remainingUsd -= spread;
    deductions.push({
      label: "Currency conversion spread",
      amount: fromUsd(spread, displayCurrency),
      note: `Paid in ${input.offerCurrency}, spent in ${displayCurrency}. Retail payroll conversion costs about ${(FX_SPREAD_PCT * 100).toFixed(1)}% before you see the money.`,
    });
  }

  if (input.employment === "CONTRACTOR") {
    const selfEmployment = remainingUsd * living.selfEmploymentTaxRate;
    remainingUsd -= selfEmployment;
    deductions.push({
      label: "Self-employment / social contributions",
      amount: fromUsd(selfEmployment, displayCurrency),
      note: `As a contractor in ${living.country} you carry both halves of the social contribution at roughly ${(living.selfEmploymentTaxRate * 100).toFixed(1)}%.`,
    });

    const benefits = living.statutoryBenefitsUsd;
    remainingUsd -= benefits;
    deductions.push({
      label: "Forfeited statutory benefits",
      amount: fromUsd(benefits, displayCurrency),
      note: "Health cover, pension match, and insurance an employer would otherwise fund. Replacing them yourself is a real annual cost.",
    });

    const unpaidLeave = grossUsd * UNPAID_LEAVE_SHARE;
    remainingUsd -= unpaidLeave;
    deductions.push({
      label: "Unpaid leave",
      amount: fromUsd(unpaidLeave, displayCurrency),
      note: "Around 20 days off plus public holidays that you fund out of the same rate.",
    });
  }

  const incomeTax = Math.max(0, remainingUsd) * living.effectiveTaxRate;
  remainingUsd -= incomeTax;
  deductions.push({
    label: "Income tax (blended effective)",
    amount: fromUsd(incomeTax, displayCurrency),
    note: `Planning estimate at ${(living.effectiveTaxRate * 100).toFixed(1)}% for ${living.country}. Not a filing calculation.`,
  });

  const netTakeHomeUsd = Math.max(0, remainingUsd);

  // --- Headline: anchor-equivalent purchasing power ------------------------
  // What a person in the anchor market would need to earn to live the way this
  // offer lets you live where you are.
  const anchorCostBase = anchor.colIndex + (anchor.rentMonthlyUsd * 12) / 1000;
  const livingCostBase = living.colIndex + (living.rentMonthlyUsd * 12) / 1000;
  const purchasingPowerRatio = anchorCostBase / livingCostBase;
  const netEffectiveValueUsd = netTakeHomeUsd * purchasingPowerRatio;

  // --- Cost breakdown ------------------------------------------------------
  const anchorRent = anchor.rentMonthlyUsd * 12;
  const livingRent = living.rentMonthlyUsd * 12;
  const anchorGroceries = anchor.groceriesMonthlyUsd * 12;
  const livingGroceries = living.groceriesMonthlyUsd * 12;

  const livingEssentials =
    Math.max(0, netTakeHomeUsd - livingRent - livingGroceries) * ESSENTIALS_SHARE;
  const anchorEssentials =
    Math.max(0, netTakeHomeUsd - anchorRent - anchorGroceries) * ESSENTIALS_SHARE;

  const livingDiscretionary = Math.max(
    0,
    netTakeHomeUsd - livingRent - livingGroceries - livingEssentials,
  );
  const anchorDiscretionary = Math.max(
    0,
    netTakeHomeUsd - anchorRent - anchorGroceries - anchorEssentials,
  );

  const line = (label: string, anchorVal: number, localVal: number): CostLine => ({
    label,
    anchorAnnual: fromUsd(anchorVal, displayCurrency),
    localAnnual: fromUsd(localVal, displayCurrency),
    delta: fromUsd(localVal - anchorVal, displayCurrency),
  });

  const costLines: CostLine[] = [
    line("Rent (1-bed, city centre)", anchorRent, livingRent),
    line("Groceries", anchorGroceries, livingGroceries),
    line("Transport, utilities, insurance", anchorEssentials, livingEssentials),
    line("Discretionary income", anchorDiscretionary, livingDiscretionary),
  ];

  // --- Savings -------------------------------------------------------------
  const savingsPotentialUsd = Math.max(
    0,
    netTakeHomeUsd - livingRent - livingGroceries - livingEssentials - livingDiscretionary * 0.55,
  );
  const savingsRatePct =
    netTakeHomeUsd > 0 ? (savingsPotentialUsd / netTakeHomeUsd) * 100 : 0;

  // --- Fairness scorecard --------------------------------------------------
  const role = input.roleId ? getRole(input.roleId) : undefined;
  const roleBaseUsd = role?.baseSalaryUsd ?? 130_000;
  // The global remote median sits between the anchor rate and the local rate;
  // most distributed employers land nearer the anchor than pure local pay.
  const globalRemoteMedianUsd =
    roleBaseUsd * (anchor.salaryMultiplier * 0.62 + living.salaryMultiplier * 0.38);
  const localMarketMedianUsd = roleBaseUsd * living.salaryMultiplier;

  const ratio = grossUsd / globalRemoteMedianUsd;
  // 1.0 of the median is a solid C+; 1.35 and up is an A.
  const rawScore = 55 + (ratio - 1) * 110;
  const score = Math.round(Math.min(100, Math.max(0, rawScore)));
  const grade = gradeFor(score);

  return {
    engineVersion: PAY_EQUITY_ENGINE_VERSION,
    currencyCode: displayCurrency,
    currencySymbol: symbol,
    grossOffer: fromUsd(grossUsd, displayCurrency),
    netEffectiveValue: fromUsd(netEffectiveValueUsd, displayCurrency),
    netTakeHome: fromUsd(netTakeHomeUsd, displayCurrency),
    deductions,
    costLines,
    savingsPotentialAnnual: fromUsd(savingsPotentialUsd, displayCurrency),
    savingsRatePct,
    fairness: {
      grade,
      score,
      globalRemoteMedian: fromUsd(globalRemoteMedianUsd, displayCurrency),
      localMarketMedian: fromUsd(localMarketMedianUsd, displayCurrency),
      verdict: verdictFor(grade, ratio),
    },
    percentileBand: {
      p25: fromUsd((role?.percentiles.p25 ?? roleBaseUsd * 0.8) * living.salaryMultiplier, displayCurrency),
      p50: fromUsd((role?.percentiles.p50 ?? roleBaseUsd) * living.salaryMultiplier, displayCurrency),
      p75: fromUsd((role?.percentiles.p75 ?? roleBaseUsd * 1.25) * living.salaryMultiplier, displayCurrency),
      p90: fromUsd((role?.percentiles.p90 ?? roleBaseUsd * 1.6) * living.salaryMultiplier, displayCurrency),
    },
  };
}
