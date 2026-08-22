/**
 * Indian income tax and payroll constants.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THESE CHANGE EVERY FEBRUARY. The Union Budget revises slabs, the
 * standard deduction and the section 87A rebate most years, and this file
 * is deliberately the only place they appear. Check it against the current
 * Finance Act before each financial year and update `ASSESSMENT_YEAR`
 * below, which is displayed to users so they can see what the figures
 * assume.
 * ─────────────────────────────────────────────────────────────────────
 *
 * Figures below reflect the regime as understood for FY 2025-26. Treat
 * them as a planning model, not a filing calculation.
 */

export const ASSESSMENT_YEAR = "FY 2025-26";

export interface TaxSlab {
  /** Income above this amount is taxed at `rate`. */
  from: number;
  /** Undefined means no upper bound. */
  to?: number;
  /** Marginal rate as a decimal. */
  rate: number;
}

/** Default regime since FY 2023-24. Fewer deductions, lower rates. */
export const NEW_REGIME_SLABS: readonly TaxSlab[] = [
  { from: 0, to: 400_000, rate: 0 },
  { from: 400_000, to: 800_000, rate: 0.05 },
  { from: 800_000, to: 1_200_000, rate: 0.1 },
  { from: 1_200_000, to: 1_600_000, rate: 0.15 },
  { from: 1_600_000, to: 2_000_000, rate: 0.2 },
  { from: 2_000_000, to: 2_400_000, rate: 0.25 },
  { from: 2_400_000, rate: 0.3 },
];

/** Retained for anyone with large deductions to claim. */
export const OLD_REGIME_SLABS: readonly TaxSlab[] = [
  { from: 0, to: 250_000, rate: 0 },
  { from: 250_000, to: 500_000, rate: 0.05 },
  { from: 500_000, to: 1_000_000, rate: 0.2 },
  { from: 1_000_000, rate: 0.3 },
];

export const STANDARD_DEDUCTION_NEW = 75_000;
export const STANDARD_DEDUCTION_OLD = 50_000;

/** Section 87A: full rebate below the threshold, so tax falls to zero. */
export const REBATE_NEW = { threshold: 1_200_000, maxRebate: 60_000 };
export const REBATE_OLD = { threshold: 500_000, maxRebate: 12_500 };

/** Health and education cess, applied on tax plus surcharge. */
export const CESS_RATE = 0.04;

/** Surcharge on high incomes. Capped at 25% under the new regime. */
export const SURCHARGE_BANDS: readonly { above: number; rate: number }[] = [
  { above: 20_000_000, rate: 0.25 },
  { above: 10_000_000, rate: 0.15 },
  { above: 5_000_000, rate: 0.1 },
];

/** Employee and employer each contribute 12% of basic to provident fund. */
export const PF_RATE = 0.12;

/**
 * Statutory PF is only mandatory on basic up to ₹15,000 a month. Many
 * employers contribute on full basic instead, which changes take-home
 * materially — hence the toggle in the calculator.
 */
export const PF_STATUTORY_WAGE_CEILING_MONTHLY = 15_000;

/** Gratuity provisioning, as commonly shown inside CTC. */
export const GRATUITY_RATE_OF_BASIC = 0.0481;

/**
 * Professional tax is a state levy. ₹2,400 a year is the common ceiling
 * (Maharashtra, Karnataka, West Bengal and others). Some states — Delhi,
 * Haryana, Uttar Pradesh — do not levy it at all.
 */
export const PROFESSIONAL_TAX_ANNUAL = 2_400;

export const STATES_WITHOUT_PROFESSIONAL_TAX = [
  "Delhi",
  "Haryana",
  "Uttar Pradesh",
  "Rajasthan",
  "Punjab (nominal)",
] as const;

/** HRA exemption is computed against 50% of basic in these cities. */
export const METRO_CITIES = ["Mumbai", "Delhi", "Kolkata", "Chennai"] as const;

/** Section 80C ceiling, which employee PF counts towards. */
export const SECTION_80C_CEILING = 150_000;

/** Section 80D, health insurance premium, self and family under 60. */
export const SECTION_80D_CEILING = 25_000;
