import {
  ASSESSMENT_YEAR,
  CESS_RATE,
  GRATUITY_RATE_OF_BASIC,
  NEW_REGIME_SLABS,
  OLD_REGIME_SLABS,
  PF_RATE,
  PF_STATUTORY_WAGE_CEILING_MONTHLY,
  PROFESSIONAL_TAX_ANNUAL,
  REBATE_NEW,
  REBATE_OLD,
  SECTION_80C_CEILING,
  SECTION_80D_CEILING,
  STANDARD_DEDUCTION_NEW,
  STANDARD_DEDUCTION_OLD,
  SURCHARGE_BANDS,
  type TaxSlab,
} from "@/data/india-tax";

export const CTC_ENGINE_VERSION = "1.0.0";

export type Regime = "new" | "old";

export interface CtcInput {
  /** Annual cost to company, in rupees. */
  ctc: number;
  /** Basic pay as a share of CTC. Most employers use 0.4 to 0.5. */
  basicPct: number;
  /** Share of CTC held back as performance-linked variable pay. */
  variablePct: number;
  /** Employer contributes PF on full basic rather than the statutory ceiling. */
  pfOnFullBasic: boolean;
  /** Metro cities allow a 50% HRA exemption instead of 40%. */
  isMetro: boolean;
  /** Some states levy no professional tax. */
  professionalTaxApplies: boolean;
  /** Monthly rent paid. Only affects the old regime, via HRA exemption. */
  monthlyRent: number;
  /** Section 80C investments excluding employee PF. Old regime only. */
  section80C: number;
  /** Section 80D health premium. Old regime only. */
  section80D: number;
}

export interface CtcLine {
  label: string;
  amount: number;
  note: string;
}

export interface RegimeResult {
  regime: Regime;
  taxableIncome: number;
  incomeTax: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  /** Exemptions and deductions applied to get there. */
  reliefs: CtcLine[];
}

export interface CtcResult {
  ctc: number;

  /** What CTC is made of. These sum to the CTC. */
  components: CtcLine[];
  /** The portion of CTC that never reaches you as cash. */
  notCash: number;

  grossSalary: number;

  /** Taken out of gross to get in-hand. */
  deductions: CtcLine[];

  annualInHand: number;
  monthlyInHand: number;
  /** In-hand as a share of CTC. The number everyone actually wants. */
  inHandPct: number;

  newRegime: RegimeResult;
  oldRegime: RegimeResult;
  betterRegime: Regime;
  regimeSaving: number;

  assessmentYear: string;
  engineVersion: string;
}

/* ------------------------------------------------------------------ */

function taxFromSlabs(income: number, slabs: readonly TaxSlab[]): number {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.from) break;
    const upper = slab.to ?? Infinity;
    tax += (Math.min(income, upper) - slab.from) * slab.rate;
  }
  return tax;
}

function surchargeFor(taxableIncome: number, tax: number): number {
  for (const band of SURCHARGE_BANDS) {
    if (taxableIncome > band.above) return tax * band.rate;
  }
  return 0;
}

/* ------------------------------------------------------------------ */

/**
 * Converts an Indian CTC into monthly take-home.
 *
 * Two things trip people up and both are modelled explicitly here. First,
 * a large part of CTC is never cash: the employer's PF contribution and
 * the gratuity provision are counted in the headline figure but land in a
 * retirement account, not a bank account. Second, variable pay is not
 * guaranteed — it is excluded from monthly in-hand and shown separately,
 * because a CTC with a heavy variable component overstates dependable
 * income.
 */
export function calculateCtc(input: CtcInput): CtcResult {
  const {
    ctc,
    basicPct,
    variablePct,
    pfOnFullBasic,
    isMetro,
    professionalTaxApplies,
    monthlyRent,
    section80C,
    section80D,
  } = input;

  // ---------------------------------------------------------- structure
  const basic = ctc * basicPct;
  const variable = ctc * variablePct;
  const hra = basic * (isMetro ? 0.5 : 0.4);

  const pfWageAnnual = pfOnFullBasic
    ? basic
    : Math.min(basic, PF_STATUTORY_WAGE_CEILING_MONTHLY * 12);

  const employerPf = pfWageAnnual * PF_RATE;
  const employeePf = pfWageAnnual * PF_RATE;
  const gratuity = basic * GRATUITY_RATE_OF_BASIC;

  // Whatever is left after the named components is special allowance.
  const specialAllowance = Math.max(
    0,
    ctc - basic - hra - variable - employerPf - gratuity,
  );

  const components: CtcLine[] = [
    {
      label: "Basic pay",
      amount: basic,
      note: "The figure everything else is calculated from — PF, gratuity and HRA all key off it.",
    },
    {
      label: "House rent allowance",
      amount: hra,
      note: isMetro
        ? "Metro city, so up to 50% of basic can be exempt from tax if you pay rent."
        : "Non-metro, so up to 40% of basic can be exempt from tax if you pay rent.",
    },
    {
      label: "Special allowance",
      amount: specialAllowance,
      note: "The balancing figure. Fully taxable, and it reaches you as cash.",
    },
    {
      label: "Employer PF contribution",
      amount: employerPf,
      note: "Counted in your CTC but paid into your provident fund, not your bank account.",
    },
    {
      label: "Gratuity provision",
      amount: gratuity,
      note: "Set aside against a payout you only receive after five years of service.",
    },
    ...(variable > 0
      ? [
          {
            label: "Variable / performance pay",
            amount: variable,
            note: "Not guaranteed. Paid on performance, often annually, and frequently below 100%.",
          },
        ]
      : []),
  ];

  const notCash = employerPf + gratuity;
  const grossSalary = basic + hra + specialAllowance;

  // ------------------------------------------------------------ regimes
  const professionalTax = professionalTaxApplies ? PROFESSIONAL_TAX_ANNUAL : 0;

  // New regime: standard deduction only.
  const newTaxable = Math.max(0, grossSalary - STANDARD_DEDUCTION_NEW);
  const newRegime = assessRegime("new", newTaxable, NEW_REGIME_SLABS, REBATE_NEW, [
    {
      label: "Standard deduction",
      amount: STANDARD_DEDUCTION_NEW,
      note: "Flat relief for salaried employees. No paperwork required.",
    },
  ]);

  // Old regime: HRA exemption, 80C, 80D, professional tax.
  const annualRent = monthlyRent * 12;
  const hraExemption = Math.max(
    0,
    Math.min(
      hra,
      Math.max(0, annualRent - basic * 0.1),
      basic * (isMetro ? 0.5 : 0.4),
    ),
  );

  const eighty0C = Math.min(SECTION_80C_CEILING, employeePf + section80C);
  const eighty0D = Math.min(SECTION_80D_CEILING, section80D);

  const oldTaxable = Math.max(
    0,
    grossSalary -
      STANDARD_DEDUCTION_OLD -
      hraExemption -
      eighty0C -
      eighty0D -
      professionalTax,
  );

  const oldRegime = assessRegime("old", oldTaxable, OLD_REGIME_SLABS, REBATE_OLD, [
    {
      label: "Standard deduction",
      amount: STANDARD_DEDUCTION_OLD,
      note: "Flat relief for salaried employees.",
    },
    {
      label: "HRA exemption",
      amount: hraExemption,
      note:
        annualRent > 0
          ? "The lowest of: actual HRA, rent minus 10% of basic, or the metro/non-metro share of basic."
          : "Zero, because no rent was entered. This is where the old regime usually wins.",
    },
    {
      label: "Section 80C",
      amount: eighty0C,
      note: "Your own PF contribution counts towards this before any extra investment does.",
    },
    ...(eighty0D > 0
      ? [
          {
            label: "Section 80D",
            amount: eighty0D,
            note: "Health insurance premium for yourself and family.",
          },
        ]
      : []),
  ]);

  const betterRegime = newRegime.totalTax <= oldRegime.totalTax ? "new" : "old";
  const chosen = betterRegime === "new" ? newRegime : oldRegime;
  const regimeSaving = Math.abs(newRegime.totalTax - oldRegime.totalTax);

  // ----------------------------------------------------------- in-hand
  const deductions: CtcLine[] = [
    {
      label: "Your PF contribution",
      amount: employeePf,
      note: "Yours, but locked away until retirement or withdrawal. Not spendable this month.",
    },
    {
      label: "Income tax (TDS)",
      amount: chosen.totalTax,
      note: `Calculated on the ${betterRegime} regime, which works out cheaper for these inputs.`,
    },
    ...(professionalTax > 0
      ? [
          {
            label: "Professional tax",
            amount: professionalTax,
            note: "A state levy, typically ₹200 a month where it applies.",
          },
        ]
      : []),
  ];

  const annualInHand = grossSalary - employeePf - chosen.totalTax - professionalTax;

  return {
    ctc,
    components,
    notCash,
    grossSalary,
    deductions,
    annualInHand,
    monthlyInHand: annualInHand / 12,
    inHandPct: annualInHand / ctc,
    newRegime,
    oldRegime,
    betterRegime,
    regimeSaving,
    assessmentYear: ASSESSMENT_YEAR,
    engineVersion: CTC_ENGINE_VERSION,
  };
}

function assessRegime(
  regime: Regime,
  taxableIncome: number,
  slabs: readonly TaxSlab[],
  rebate: { threshold: number; maxRebate: number },
  reliefs: CtcLine[],
): RegimeResult {
  let incomeTax = taxFromSlabs(taxableIncome, slabs);

  // Section 87A wipes out tax entirely below the threshold.
  if (taxableIncome <= rebate.threshold) {
    incomeTax = Math.max(0, incomeTax - rebate.maxRebate);
  }

  const surcharge = surchargeFor(taxableIncome, incomeTax);
  const cess = (incomeTax + surcharge) * CESS_RATE;

  return {
    regime,
    taxableIncome,
    incomeTax,
    surcharge,
    cess,
    totalTax: incomeTax + surcharge + cess,
    reliefs,
  };
}

/** Sensible starting point: a mid-market Indian software job. */
export const CTC_DEFAULTS: CtcInput = {
  ctc: 1_800_000,
  basicPct: 0.45,
  variablePct: 0.1,
  pfOnFullBasic: false,
  isMetro: false,
  professionalTaxApplies: true,
  monthlyRent: 25_000,
  section80C: 0,
  section80D: 0,
};
