// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

export type Track =
  | "engineering"
  | "data"
  | "product"
  | "design"
  | "security"
  | "infrastructure";

export interface Role {
  id: string;
  name: string;
  track: Track;
  /** Median total cash for this role in the US baseline market, USD. */
  baseSalaryUsd: number;
  /** Percentile spread of the same market, USD. Drives the Pro paywall layer. */
  percentiles: { p25: number; p50: number; p75: number; p90: number };
  /** Skill ids that materially move pay for this role. */
  relevantSkills: string[];
  /** Roles this one commonly transitions into. */
  adjacentRoles: string[];
}

export type SkillCategory =
  | "language"
  | "framework"
  | "platform"
  | "data"
  | "practice"
  | "domain";

export interface Skill {
  id: string;
  name: string;
  slug: string;
  category: SkillCategory;
  /** Median self-study hours to reach hiring-signal proficiency. */
  learningHours: number;
  /**
   * Median compensation lift observed when this skill is added to a stack that
   * doesn't already have it, as a fraction of base (0.08 = +8%).
   */
  baseLiftPct: number;
  /** 0–1. Postings mentioning the skill / total postings in the track. */
  demandIndex: number;
  /** 0–1. Share of candidates in the track who already list it. Higher = commoditised. */
  supplyIndex: number;
  /** Roles where the lift figure was measured. Others get an affinity discount. */
  strongForRoles: string[];
  /** Holding these first cuts the learning curve. */
  prerequisites: string[];
  /** Sample size behind the estimate — drives the confidence label. */
  sampleSize: number;
  roadmapUrl: string;
}

export interface CityMarket {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  currencyCode: string;
  /** Cost of living index, New York City = 100. Rent excluded. */
  colIndex: number;
  /** Monthly rent, 1-bed city centre, in USD. */
  rentMonthlyUsd: number;
  /** Monthly groceries basket for one adult, USD. */
  groceriesMonthlyUsd: number;
  /** Local pay level for the same role vs the US baseline. 1.0 = parity. */
  salaryMultiplier: number;
  /** Blended effective income + social tax rate for a mid-six-figure earner. */
  effectiveTaxRate: number;
  /** Additional self-employment / social contribution load in contractor mode. */
  selfEmploymentTaxRate: number;
  /** Annual employer-funded benefits value forfeited as a contractor, USD. */
  statutoryBenefitsUsd: number;
  isAnchorMarket: boolean;
}

export interface FxRate {
  /** Units of this currency per 1 USD. */
  code: string;
  perUsd: number;
  symbol: string;
}

// ---------------------------------------------------------------------------
// Skill Arbitrage
// ---------------------------------------------------------------------------

export type Confidence = "high" | "medium" | "low";

export interface ArbitrageRecommendation {
  skillId: string;
  skillName: string;
  skillSlug: string;
  category: SkillCategory;
  /** Fraction of base, after affinity / saturation / synergy adjustments. */
  liftPct: number;
  /** Annual lift in the target currency. */
  salaryLift: number;
  /** Hours after prerequisite and seniority discounts. */
  effectiveHours: number;
  baseHours: number;
  /** (salaryLift / effectiveHours) * 100, per the product spec. */
  arbitrageIndex: number;
  /** 0–100 normalised against the strongest candidate in this run. */
  normalisedScore: number;
  quadrant: "quick-win" | "strategic" | "incremental" | "long-haul";
  confidence: Confidence;
  rationale: string;
  roadmapUrl: string;
}

export interface SkillArbitrageResult {
  engineVersion: string;
  currencyCode: string;
  currencySymbol: string;
  baseSalary: number;
  targetRoleName: string | null;
  /** Sorted by arbitrageIndex, highest first. */
  recommendations: ArbitrageRecommendation[];
  /** Combined lift if the top three are all acquired, with overlap decay. */
  stackedLift: { salaryLift: number; liftPct: number; totalHours: number };
  medianHourlyReturn: number;
}

// ---------------------------------------------------------------------------
// Remote Pay Equity
// ---------------------------------------------------------------------------

export interface CostLine {
  label: string;
  anchorAnnual: number;
  localAnnual: number;
  /** localAnnual - anchorAnnual, negative means cheaper where you live. */
  delta: number;
}

export interface EquityDeduction {
  label: string;
  amount: number;
  note: string;
}

export type FairnessGrade = "A" | "B" | "C" | "D" | "F";

export interface RemotePayEquityResult {
  engineVersion: string;
  currencyCode: string;
  currencySymbol: string;

  grossOffer: number;
  /** Headline metric: anchor-market salary that buys the same lifestyle. */
  netEffectiveValue: number;
  /** What actually lands in the bank after tax and structure deductions. */
  netTakeHome: number;

  deductions: EquityDeduction[];
  costLines: CostLine[];

  savingsPotentialAnnual: number;
  savingsRatePct: number;

  fairness: {
    grade: FairnessGrade;
    score: number;
    globalRemoteMedian: number;
    localMarketMedian: number;
    verdict: string;
  };

  /** Locked behind the Pro layer. */
  percentileBand: { p25: number; p50: number; p75: number; p90: number };
}
