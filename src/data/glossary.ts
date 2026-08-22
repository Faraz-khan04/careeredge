/**
 * Plain-English definitions for every technical term the site uses.
 *
 * Rules for writing these: short sentences, no jargon inside the definition,
 * and a concrete example wherever a number would help. If a definition needs
 * a second definition to make sense, it is not finished.
 *
 * Aim is roughly a 13-year-old reading level. Most visitors are not
 * compensation analysts, and plenty are reading in a second language.
 */

export interface GlossaryEntry {
  term: string;
  /** One sentence. What it is. */
  short: string;
  /** Optional second sentence with a concrete example. */
  example?: string;
}

export const GLOSSARY = {
  arbitrageIndex: {
    term: "Arbitrage index",
    short: "A score for how much money a skill earns you for each hour you spend learning it.",
    example: "A higher score means better value for your time. It is only useful for comparing skills against each other, not as an amount of money.",
  },
  salaryLift: {
    term: "Pay lift",
    short: "How much more you could earn per year after learning this skill.",
    example: "A lift of $17,560 means someone with your background, plus this skill, typically earns that much more.",
  },
  effectiveHours: {
    term: "Effective study hours",
    short: "How many hours of study this skill should take you, not a beginner.",
    example: "If you already know the basics it needs, this number is lower than the usual estimate.",
  },
  quadrant: {
    term: "Quick win, strategic, long haul",
    short: "A grouping that tells you whether a skill pays off fast or slowly.",
    example: "Quick win means good money for few hours. Long haul means a big time investment before it pays.",
  },
  confidence: {
    term: "Confidence",
    short: "How much data sits behind a number.",
    example: "High confidence means we have plenty of salary reports for this skill. Low confidence means treat it as a rough direction, not a promise.",
  },

  cola: {
    term: "COLA (cost-of-living adjusted pay)",
    short: "Pay compared fairly between two cities by accounting for how expensive each one is.",
    example: "\u20B910 lakh in Indore goes further than \u20B910 lakh in Mumbai. A COLA figure lets you compare the two honestly.",
  },
  skillRoi: {
    term: "Skill ROI",
    short: "Return on investment for a skill \u2014 the pay rise you get, measured against the hours you spend learning it.",
    example: "A skill worth \u20B92 lakh more that takes 40 hours has far better ROI than one worth \u20B93 lakh that takes 400.",
  },
  netEffectiveValue: {
    term: "Purchasing power",
    short: "What your pay is worth where you live, compared to the company's home city.",
    example: "This is not money in your account. It answers: to live this way in San Francisco, what salary would you need there?",
  },
  netTakeHome: {
    term: "Net take-home",
    short: "The money that actually reaches your bank account each year, after tax and everything else comes out.",
  },
  fxSpread: {
    term: "Currency conversion cost",
    short: "The cut a bank takes when your pay is converted from one currency to another.",
    example: "If you are paid in dollars but spend in euros, roughly 1.4% disappears in the exchange.",
  },
  selfEmploymentTax: {
    term: "Self-employment tax",
    short: "When you are a contractor, you pay both your share and the employer's share of social contributions.",
    example: "An employee splits this cost with their company. A contractor pays all of it.",
  },
  statutoryBenefits: {
    term: "Benefits you lose",
    short: "Things an employer normally pays for that a contractor has to buy themselves.",
    example: "Health cover, pension contributions and insurance. These cost real money every year.",
  },
  unpaidLeave: {
    term: "Unpaid time off",
    short: "As a contractor, days you do not work are days you do not get paid.",
    example: "Around 20 holiday days plus public holidays comes out of your own rate.",
  },
  effectiveTaxRate: {
    term: "Effective tax rate",
    short: "The average share of your income that goes to tax, across all the tax bands.",
    example: "This is a planning estimate. Your real bill depends on deductions and your personal situation.",
  },
  fairnessGrade: {
    term: "Fairness grade",
    short: "A letter from A to F comparing this offer against typical remote pay worldwide.",
    example: "A C is roughly average. It compares the offer to the market — it does not say whether a company is behaving badly.",
  },
  costIndex: {
    term: "Cost of living index",
    short: "A number showing how expensive a city is compared with others.",
    example: "New York is set at 100. A city at 50 is roughly half as expensive to live in.",
  },

  clarityScore: {
    term: "Clarity score",
    short: "How much a job posting actually tells you, out of 100.",
    example: "It scores the writing, not the company. A good employer can still write a vague posting.",
  },
  anchorMarket: {
    term: "Company location",
    short: "The city the company pays from, which usually sets the salary band.",
  },
  livingMarket: {
    term: "Where you live",
    short: "The city where you actually spend the money, which sets your costs and your tax.",
  },
} as const satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof GLOSSARY;
