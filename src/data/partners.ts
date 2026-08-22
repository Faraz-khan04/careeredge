export type PartnerCategory = "course" | "bootcamp" | "fx" | "eor" | "tax" | "banking";

export interface PartnerOffer {
  slug: string;
  name: string;
  category: PartnerCategory;
  blurb: string;
  ctaLabel: string;
  url: string;
  /** Shows when a recommendation names one of these skills. */
  skillSlugs: string[];
  /** Shows when the living or anchor market is in one of these countries. */
  countryCodes: string[];
  /** Higher wins when several partners match the same slot. */
  priority: number;
  disclosure: string;
}

/**
 * Every card here is a paid placement and says so. Undisclosed affiliate links
 * on a salary-transparency product would be the fastest way to lose the
 * audience, so the disclosure ships with the card, not in a footer.
 */
export const PARTNERS: readonly PartnerOffer[] = [
  {
    slug: "frontend-masters",
    name: "Frontend Masters",
    category: "course",
    blurb: "Workshop-length courses on TypeScript, React, Next.js and web performance, taught by the people who maintain them.",
    ctaLabel: "See the learning paths",
    url: "https://frontendmasters.com",
    skillSlugs: ["typescript", "react", "nextjs", "web-performance", "accessibility", "testing", "nodejs"],
    countryCodes: [],
    priority: 80,
    disclosure: "Paid placement",
  },
  {
    slug: "kodekloud",
    name: "KodeKloud",
    category: "course",
    blurb: "Hands-on Kubernetes, Terraform and CI/CD labs with exam prep for CKA and Terraform Associate.",
    ctaLabel: "Start the lab track",
    url: "https://kodekloud.com",
    skillSlugs: ["kubernetes", "terraform", "aws", "observability"],
    countryCodes: [],
    priority: 75,
    disclosure: "Paid placement",
  },
  {
    slug: "dbt-learn",
    name: "dbt Learn",
    category: "course",
    blurb: "The official dbt curriculum, from first model to production deployment and testing.",
    ctaLabel: "Open the course",
    url: "https://courses.getdbt.com",
    skillSlugs: ["dbt", "snowflake", "data-modelling", "sql"],
    countryCodes: [],
    priority: 70,
    disclosure: "Paid placement",
  },
  {
    slug: "deeplearning-ai",
    name: "DeepLearning.AI",
    category: "course",
    blurb: "Short courses on RAG, agents and evaluation, plus the longer ML and PyTorch specialisations.",
    ctaLabel: "Browse the AI courses",
    url: "https://www.deeplearning.ai",
    skillSlugs: ["llm-engineering", "ml-fundamentals", "pytorch", "mlops", "python"],
    countryCodes: [],
    priority: 85,
    disclosure: "Paid placement",
  },
  {
    slug: "educative-system-design",
    name: "Educative",
    category: "course",
    blurb: "Text-based system design and distributed systems tracks you can work through without video.",
    ctaLabel: "Try the system design track",
    url: "https://www.educative.io",
    skillSlugs: ["system-design", "distributed-systems", "kafka", "go", "rust"],
    countryCodes: [],
    priority: 65,
    disclosure: "Paid placement",
  },
  {
    slug: "wise",
    name: "Wise",
    category: "fx",
    blurb: "Mid-market exchange rates for cross-border salary transfers, with local account details in 9 currencies.",
    ctaLabel: "Compare the transfer cost",
    url: "https://wise.com",
    skillSlugs: [],
    countryCodes: ["*"],
    priority: 90,
    disclosure: "Paid placement",
  },
  {
    slug: "deel",
    name: "Deel",
    category: "eor",
    blurb: "Contractor and employer-of-record agreements for people paid from a country they don't live in.",
    ctaLabel: "See contractor options",
    url: "https://www.deel.com",
    skillSlugs: [],
    countryCodes: ["*"],
    priority: 88,
    disclosure: "Paid placement",
  },
  {
    slug: "remote-com",
    name: "Remote",
    category: "eor",
    blurb: "Employer-of-record cover so a remote role comes with statutory benefits instead of a bare contract.",
    ctaLabel: "Check EOR coverage",
    url: "https://remote.com",
    skillSlugs: [],
    countryCodes: ["PT", "PL", "DE", "NL", "BR", "MX", "IN", "ZA"],
    priority: 72,
    disclosure: "Paid placement",
  },
  {
    slug: "keeper-tax",
    name: "Keeper",
    category: "tax",
    blurb: "Quarterly estimates and deduction tracking for people invoicing a foreign client as a sole trader.",
    ctaLabel: "Estimate quarterly tax",
    url: "https://keepertax.com",
    skillSlugs: [],
    countryCodes: ["US"],
    priority: 60,
    disclosure: "Paid placement",
  },
];

/** Course and bootcamp cards matched to the skills a run recommends. */
export function partnersForSkills(skillSlugs: string[], limit = 2): PartnerOffer[] {
  const wanted = new Set(skillSlugs);
  return PARTNERS.filter(
    (p) =>
      (p.category === "course" || p.category === "bootcamp") &&
      p.skillSlugs.some((s) => wanted.has(s)),
  )
    .sort((a, b) => {
      const aHits = a.skillSlugs.filter((s) => wanted.has(s)).length;
      const bHits = b.skillSlugs.filter((s) => wanted.has(s)).length;
      return bHits - aHits || b.priority - a.priority;
    })
    .slice(0, limit);
}

/** FX, EOR and tax cards, shown only when money actually crosses a border. */
export function partnersForCrossBorder(
  countryCode: string,
  opts: { isContractor: boolean; isCurrencyConverted: boolean },
  limit = 2,
): PartnerOffer[] {
  const categories: PartnerCategory[] = [];
  if (opts.isCurrencyConverted) categories.push("fx", "banking");
  if (opts.isContractor) categories.push("eor", "tax");

  if (categories.length === 0) return [];

  return PARTNERS.filter(
    (p) =>
      categories.includes(p.category) &&
      (p.countryCodes.includes("*") || p.countryCodes.includes(countryCode)),
  )
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

/** Appends the affiliate tag without mangling existing query strings. */
export function withAffiliateTag(url: string): string {
  const tag = process.env.NEXT_PUBLIC_AFFILIATE_TAG;
  if (!tag) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("ref", tag);
    return parsed.toString();
  } catch {
    return url;
  }
}
