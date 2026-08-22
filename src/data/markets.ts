import type { CityMarket, FxRate } from "@/types";

/**
 * Cost indices are NYC = 100 (Numbeo-style, rent excluded from `colIndex` and
 * accounted for separately). Tax rates are blended effective rates for a
 * mid-six-figure single filer, not marginal rates — they are a planning
 * estimate, not a filing calculation.
 */
export const MARKETS: readonly CityMarket[] = [
  {
    id: "san-francisco", city: "San Francisco", country: "United States", countryCode: "US",
    currencyCode: "USD", colIndex: 96.4, rentMonthlyUsd: 3350, groceriesMonthlyUsd: 620,
    salaryMultiplier: 1.34, effectiveTaxRate: 0.335, selfEmploymentTaxRate: 0.153,
    statutoryBenefitsUsd: 21_500, isAnchorMarket: true,
  },
  {
    id: "new-york", city: "New York", country: "United States", countryCode: "US",
    currencyCode: "USD", colIndex: 100, rentMonthlyUsd: 3900, groceriesMonthlyUsd: 640,
    salaryMultiplier: 1.22, effectiveTaxRate: 0.328, selfEmploymentTaxRate: 0.153,
    statutoryBenefitsUsd: 20_800, isAnchorMarket: true,
  },
  {
    id: "austin", city: "Austin", country: "United States", countryCode: "US",
    currencyCode: "USD", colIndex: 74.1, rentMonthlyUsd: 1720, groceriesMonthlyUsd: 490,
    salaryMultiplier: 1.02, effectiveTaxRate: 0.243, selfEmploymentTaxRate: 0.153,
    statutoryBenefitsUsd: 19_400, isAnchorMarket: true,
  },
  {
    id: "london", city: "London", country: "United Kingdom", countryCode: "GB",
    currencyCode: "GBP", colIndex: 77.3, rentMonthlyUsd: 2680, groceriesMonthlyUsd: 470,
    salaryMultiplier: 0.71, effectiveTaxRate: 0.322, selfEmploymentTaxRate: 0.09,
    statutoryBenefitsUsd: 12_600, isAnchorMarket: true,
  },
  {
    id: "berlin", city: "Berlin", country: "Germany", countryCode: "DE",
    currencyCode: "EUR", colIndex: 65.8, rentMonthlyUsd: 1490, groceriesMonthlyUsd: 400,
    salaryMultiplier: 0.62, effectiveTaxRate: 0.385, selfEmploymentTaxRate: 0.19,
    statutoryBenefitsUsd: 16_200, isAnchorMarket: true,
  },
  {
    id: "amsterdam", city: "Amsterdam", country: "Netherlands", countryCode: "NL",
    currencyCode: "EUR", colIndex: 71.2, rentMonthlyUsd: 2020, groceriesMonthlyUsd: 420,
    salaryMultiplier: 0.66, effectiveTaxRate: 0.372, selfEmploymentTaxRate: 0.14,
    statutoryBenefitsUsd: 15_100, isAnchorMarket: false,
  },
  {
    id: "lisbon", city: "Lisbon", country: "Portugal", countryCode: "PT",
    currencyCode: "EUR", colIndex: 52.4, rentMonthlyUsd: 1420, groceriesMonthlyUsd: 320,
    salaryMultiplier: 0.38, effectiveTaxRate: 0.348, selfEmploymentTaxRate: 0.214,
    statutoryBenefitsUsd: 9_800, isAnchorMarket: false,
  },
  {
    id: "warsaw", city: "Warsaw", country: "Poland", countryCode: "PL",
    currencyCode: "PLN", colIndex: 44.9, rentMonthlyUsd: 920, groceriesMonthlyUsd: 280,
    salaryMultiplier: 0.34, effectiveTaxRate: 0.243, selfEmploymentTaxRate: 0.12,
    statutoryBenefitsUsd: 7_400, isAnchorMarket: false,
  },
  {
    id: "bangalore", city: "Bengaluru", country: "India", countryCode: "IN",
    currencyCode: "INR", colIndex: 25.6, rentMonthlyUsd: 380, groceriesMonthlyUsd: 145,
    salaryMultiplier: 0.19, effectiveTaxRate: 0.246, selfEmploymentTaxRate: 0.06,
    statutoryBenefitsUsd: 3_200, isAnchorMarket: false,
  },
  {
    id: "mumbai", city: "Mumbai", country: "India", countryCode: "IN",
    currencyCode: "INR", colIndex: 28.9, rentMonthlyUsd: 620, groceriesMonthlyUsd: 160,
    salaryMultiplier: 0.21, effectiveTaxRate: 0.246, selfEmploymentTaxRate: 0.06,
    statutoryBenefitsUsd: 3_400, isAnchorMarket: false,
  },
  {
    id: "hyderabad", city: "Hyderabad", country: "India", countryCode: "IN",
    currencyCode: "INR", colIndex: 23.4, rentMonthlyUsd: 300, groceriesMonthlyUsd: 135,
    salaryMultiplier: 0.185, effectiveTaxRate: 0.246, selfEmploymentTaxRate: 0.06,
    statutoryBenefitsUsd: 3_100, isAnchorMarket: false,
  },
  {
    id: "pune", city: "Pune", country: "India", countryCode: "IN",
    currencyCode: "INR", colIndex: 23.8, rentMonthlyUsd: 320, groceriesMonthlyUsd: 138,
    salaryMultiplier: 0.175, effectiveTaxRate: 0.246, selfEmploymentTaxRate: 0.06,
    statutoryBenefitsUsd: 3_000, isAnchorMarket: false,
  },
  {
    id: "gurugram", city: "Gurugram / Delhi NCR", country: "India", countryCode: "IN",
    currencyCode: "INR", colIndex: 25.1, rentMonthlyUsd: 400, groceriesMonthlyUsd: 142,
    salaryMultiplier: 0.19, effectiveTaxRate: 0.246, selfEmploymentTaxRate: 0.06,
    statutoryBenefitsUsd: 3_200, isAnchorMarket: false,
  },
  {
    id: "noida", city: "Noida", country: "India", countryCode: "IN",
    currencyCode: "INR", colIndex: 22.9, rentMonthlyUsd: 280, groceriesMonthlyUsd: 132,
    salaryMultiplier: 0.17, effectiveTaxRate: 0.246, selfEmploymentTaxRate: 0.06,
    statutoryBenefitsUsd: 2_900, isAnchorMarket: false,
  },
  {
    id: "chennai", city: "Chennai", country: "India", countryCode: "IN",
    currencyCode: "INR", colIndex: 22.1, rentMonthlyUsd: 265, groceriesMonthlyUsd: 130,
    salaryMultiplier: 0.165, effectiveTaxRate: 0.246, selfEmploymentTaxRate: 0.06,
    statutoryBenefitsUsd: 2_900, isAnchorMarket: false,
  },
  {
    id: "kolkata", city: "Kolkata", country: "India", countryCode: "IN",
    currencyCode: "INR", colIndex: 19.8, rentMonthlyUsd: 210, groceriesMonthlyUsd: 118,
    salaryMultiplier: 0.14, effectiveTaxRate: 0.246, selfEmploymentTaxRate: 0.06,
    statutoryBenefitsUsd: 2_600, isAnchorMarket: false,
  },
  {
    id: "ahmedabad", city: "Ahmedabad", country: "India", countryCode: "IN",
    currencyCode: "INR", colIndex: 19.2, rentMonthlyUsd: 205, groceriesMonthlyUsd: 115,
    salaryMultiplier: 0.135, effectiveTaxRate: 0.246, selfEmploymentTaxRate: 0.06,
    statutoryBenefitsUsd: 2_500, isAnchorMarket: false,
  },
  {
    id: "kochi", city: "Kochi", country: "India", countryCode: "IN",
    currencyCode: "INR", colIndex: 20.4, rentMonthlyUsd: 225, groceriesMonthlyUsd: 122,
    salaryMultiplier: 0.14, effectiveTaxRate: 0.246, selfEmploymentTaxRate: 0.06,
    statutoryBenefitsUsd: 2_600, isAnchorMarket: false,
  },
  {
    id: "jaipur", city: "Jaipur", country: "India", countryCode: "IN",
    currencyCode: "INR", colIndex: 18.6, rentMonthlyUsd: 190, groceriesMonthlyUsd: 112,
    salaryMultiplier: 0.125, effectiveTaxRate: 0.246, selfEmploymentTaxRate: 0.06,
    statutoryBenefitsUsd: 2_400, isAnchorMarket: false,
  },
  {
    id: "indore", city: "Indore", country: "India", countryCode: "IN",
    currencyCode: "INR", colIndex: 17.9, rentMonthlyUsd: 175, groceriesMonthlyUsd: 108,
    salaryMultiplier: 0.12, effectiveTaxRate: 0.246, selfEmploymentTaxRate: 0.06,
    statutoryBenefitsUsd: 2_300, isAnchorMarket: false,
  },
  {
    id: "sao-paulo", city: "São Paulo", country: "Brazil", countryCode: "BR",
    currencyCode: "BRL", colIndex: 38.2, rentMonthlyUsd: 640, groceriesMonthlyUsd: 240,
    salaryMultiplier: 0.28, effectiveTaxRate: 0.271, selfEmploymentTaxRate: 0.11,
    statutoryBenefitsUsd: 6_100, isAnchorMarket: false,
  },
  {
    id: "mexico-city", city: "Mexico City", country: "Mexico", countryCode: "MX",
    currencyCode: "MXN", colIndex: 41.6, rentMonthlyUsd: 780, groceriesMonthlyUsd: 260,
    salaryMultiplier: 0.31, effectiveTaxRate: 0.258, selfEmploymentTaxRate: 0.105,
    statutoryBenefitsUsd: 5_800, isAnchorMarket: false,
  },
  {
    id: "toronto", city: "Toronto", country: "Canada", countryCode: "CA",
    currencyCode: "CAD", colIndex: 72.5, rentMonthlyUsd: 2050, groceriesMonthlyUsd: 460,
    salaryMultiplier: 0.74, effectiveTaxRate: 0.316, selfEmploymentTaxRate: 0.107,
    statutoryBenefitsUsd: 13_900, isAnchorMarket: true,
  },
  {
    id: "singapore", city: "Singapore", country: "Singapore", countryCode: "SG",
    currencyCode: "SGD", colIndex: 83.1, rentMonthlyUsd: 3100, groceriesMonthlyUsd: 480,
    salaryMultiplier: 0.88, effectiveTaxRate: 0.152, selfEmploymentTaxRate: 0.04,
    statutoryBenefitsUsd: 11_200, isAnchorMarket: true,
  },
  {
    id: "sydney", city: "Sydney", country: "Australia", countryCode: "AU",
    currencyCode: "AUD", colIndex: 78.4, rentMonthlyUsd: 2380, groceriesMonthlyUsd: 500,
    salaryMultiplier: 0.79, effectiveTaxRate: 0.301, selfEmploymentTaxRate: 0.115,
    statutoryBenefitsUsd: 14_300, isAnchorMarket: false,
  },
  {
    id: "dubai", city: "Dubai", country: "United Arab Emirates", countryCode: "AE",
    currencyCode: "AED", colIndex: 66.7, rentMonthlyUsd: 2200, groceriesMonthlyUsd: 420,
    salaryMultiplier: 0.72, effectiveTaxRate: 0.0, selfEmploymentTaxRate: 0.0,
    statutoryBenefitsUsd: 6_500, isAnchorMarket: false,
  },
  {
    id: "cape-town", city: "Cape Town", country: "South Africa", countryCode: "ZA",
    currencyCode: "ZAR", colIndex: 37.8, rentMonthlyUsd: 720, groceriesMonthlyUsd: 230,
    salaryMultiplier: 0.26, effectiveTaxRate: 0.312, selfEmploymentTaxRate: 0.09,
    statutoryBenefitsUsd: 4_900, isAnchorMarket: false,
  },
  {
    id: "global-remote", city: "Global Remote (blended)", country: "—", countryCode: "US",
    currencyCode: "USD", colIndex: 68.0, rentMonthlyUsd: 1600, groceriesMonthlyUsd: 400,
    salaryMultiplier: 0.85, effectiveTaxRate: 0.28, selfEmploymentTaxRate: 0.12,
    statutoryBenefitsUsd: 12_000, isAnchorMarket: true,
  },
] as const;

export const MARKET_BY_ID = new Map(MARKETS.map((m) => [m.id, m]));

export function getMarket(id: string): CityMarket | undefined {
  return MARKET_BY_ID.get(id);
}

export const ANCHOR_MARKETS = MARKETS.filter((m) => m.isAnchorMarket);

/**
 * Indicative mid-market rates. Swap for a cached provider call (ECB, OpenFX)
 * behind `lib/fx.ts` in production — the engine reads `perUsd` only.
 */
export const FX_RATES: readonly FxRate[] = [
  { code: "USD", perUsd: 1, symbol: "$" },
  { code: "EUR", perUsd: 0.92, symbol: "€" },
  { code: "GBP", perUsd: 0.78, symbol: "£" },
  { code: "CAD", perUsd: 1.37, symbol: "CA$" },
  { code: "AUD", perUsd: 1.52, symbol: "A$" },
  { code: "SGD", perUsd: 1.34, symbol: "S$" },
  { code: "INR", perUsd: 83.4, symbol: "₹" },
  { code: "BRL", perUsd: 5.42, symbol: "R$" },
  { code: "MXN", perUsd: 17.9, symbol: "MX$" },
  { code: "PLN", perUsd: 3.98, symbol: "zł" },
  { code: "AED", perUsd: 3.67, symbol: "AED " },
  { code: "ZAR", perUsd: 18.4, symbol: "R" },
] as const;

export const FX_BY_CODE = new Map(FX_RATES.map((f) => [f.code, f]));

/** Typical retail spread paid on a cross-border payroll conversion. */
export const FX_SPREAD_PCT = 0.014;

export function toUsd(amount: number, currencyCode: string): number {
  const rate = FX_BY_CODE.get(currencyCode);
  return rate ? amount / rate.perUsd : amount;
}

export function fromUsd(amountUsd: number, currencyCode: string): number {
  const rate = FX_BY_CODE.get(currencyCode);
  return rate ? amountUsd * rate.perUsd : amountUsd;
}

export function currencySymbol(currencyCode: string): string {
  return FX_BY_CODE.get(currencyCode)?.symbol ?? "";
}
