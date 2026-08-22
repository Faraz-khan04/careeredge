import type { Role } from "@/types";

/**
 * US baseline market medians (total cash: base + target bonus), 2025 blend of
 * levels.fyi, BLS OES and Stack Overflow survey bands. Replace with a live
 * compensation feed in production — the engine only reads the shape.
 */
export const ROLES: readonly Role[] = [
  {
    id: "frontend-engineer",
    name: "Frontend Engineer",
    track: "engineering",
    baseSalaryUsd: 132_000,
    percentiles: { p25: 104_000, p50: 132_000, p75: 168_000, p90: 214_000 },
    relevantSkills: [
      "typescript", "react", "nextjs", "graphql", "tailwind", "web-perf",
      "accessibility", "testing", "node", "aws", "system-design", "rust",
    ],
    adjacentRoles: ["fullstack-engineer", "product-engineer", "engineering-manager"],
  },
  {
    id: "backend-engineer",
    name: "Backend Engineer",
    track: "engineering",
    baseSalaryUsd: 145_000,
    percentiles: { p25: 116_000, p50: 145_000, p75: 182_000, p90: 235_000 },
    relevantSkills: [
      "go", "rust", "kubernetes", "postgres", "kafka", "system-design", "aws",
      "terraform", "graphql", "node", "observability", "security-eng",
    ],
    adjacentRoles: ["platform-engineer", "fullstack-engineer", "staff-engineer"],
  },
  {
    id: "fullstack-engineer",
    name: "Full-Stack Engineer",
    track: "engineering",
    baseSalaryUsd: 140_000,
    percentiles: { p25: 110_000, p50: 140_000, p75: 176_000, p90: 228_000 },
    relevantSkills: [
      "typescript", "react", "nextjs", "node", "postgres", "aws", "graphql",
      "kubernetes", "system-design", "testing", "llm-engineering",
    ],
    adjacentRoles: ["backend-engineer", "product-engineer", "platform-engineer"],
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    track: "data",
    baseSalaryUsd: 92_000,
    percentiles: { p25: 72_000, p50: 92_000, p75: 118_000, p90: 148_000 },
    relevantSkills: [
      "sql", "python", "dbt", "tableau", "spark", "statistics", "airflow",
      "snowflake", "experimentation", "ml-fundamentals",
    ],
    adjacentRoles: ["analytics-engineer", "data-scientist", "product-manager"],
  },
  {
    id: "analytics-engineer",
    name: "Analytics Engineer",
    track: "data",
    baseSalaryUsd: 128_000,
    percentiles: { p25: 102_000, p50: 128_000, p75: 158_000, p90: 196_000 },
    relevantSkills: [
      "dbt", "sql", "snowflake", "airflow", "python", "spark", "terraform",
      "data-modelling", "experimentation",
    ],
    adjacentRoles: ["data-engineer", "data-scientist"],
  },
  {
    id: "data-scientist",
    name: "Data Scientist",
    track: "data",
    baseSalaryUsd: 152_000,
    percentiles: { p25: 120_000, p50: 152_000, p75: 192_000, p90: 252_000 },
    relevantSkills: [
      "python", "statistics", "ml-fundamentals", "llm-engineering", "spark",
      "experimentation", "sql", "pytorch", "mlops",
    ],
    adjacentRoles: ["ml-engineer", "analytics-engineer"],
  },
  {
    id: "ml-engineer",
    name: "ML Engineer",
    track: "data",
    baseSalaryUsd: 178_000,
    percentiles: { p25: 142_000, p50: 178_000, p75: 228_000, p90: 310_000 },
    relevantSkills: [
      "pytorch", "llm-engineering", "mlops", "python", "kubernetes", "aws",
      "distributed-systems", "ml-fundamentals", "observability",
    ],
    adjacentRoles: ["data-scientist", "platform-engineer"],
  },
  {
    id: "platform-engineer",
    name: "Platform / DevOps Engineer",
    track: "infrastructure",
    baseSalaryUsd: 155_000,
    percentiles: { p25: 124_000, p50: 155_000, p75: 194_000, p90: 248_000 },
    relevantSkills: [
      "kubernetes", "terraform", "aws", "go", "observability", "security-eng",
      "distributed-systems", "kafka", "system-design",
    ],
    adjacentRoles: ["backend-engineer", "sre", "security-engineer"],
  },
  {
    id: "security-engineer",
    name: "Security Engineer",
    track: "security",
    baseSalaryUsd: 158_000,
    percentiles: { p25: 126_000, p50: 158_000, p75: 198_000, p90: 256_000 },
    relevantSkills: [
      "security-eng", "kubernetes", "terraform", "aws", "go", "python",
      "observability", "compliance",
    ],
    adjacentRoles: ["platform-engineer", "backend-engineer"],
  },
  {
    id: "product-manager",
    name: "Product Manager",
    track: "product",
    baseSalaryUsd: 148_000,
    percentiles: { p25: 116_000, p50: 148_000, p75: 188_000, p90: 246_000 },
    relevantSkills: [
      "sql", "experimentation", "product-analytics", "llm-engineering",
      "statistics", "system-design", "pricing-strategy", "user-research",
    ],
    adjacentRoles: ["product-engineer", "growth-pm", "product-designer"],
  },
  {
    id: "product-designer",
    name: "Product Designer",
    track: "design",
    baseSalaryUsd: 124_000,
    percentiles: { p25: 96_000, p50: 124_000, p75: 158_000, p90: 202_000 },
    relevantSkills: [
      "design-systems", "user-research", "prototyping", "accessibility",
      "typescript", "product-analytics", "motion-design",
    ],
    adjacentRoles: ["product-manager", "frontend-engineer"],
  },
  {
    id: "engineering-manager",
    name: "Engineering Manager",
    track: "engineering",
    baseSalaryUsd: 192_000,
    percentiles: { p25: 156_000, p50: 192_000, p75: 240_000, p90: 315_000 },
    relevantSkills: [
      "system-design", "people-management", "pricing-strategy", "observability",
      "distributed-systems", "compliance",
    ],
    adjacentRoles: ["staff-engineer", "product-manager"],
  },
] as const;

export const ROLE_BY_ID = new Map(ROLES.map((r) => [r.id, r]));

export function getRole(id: string): Role | undefined {
  return ROLE_BY_ID.get(id);
}
