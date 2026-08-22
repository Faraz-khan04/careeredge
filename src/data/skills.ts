import type { Skill } from "@/types";

/**
 * `baseLiftPct` is the median comp delta for candidates who added the skill to
 * a stack that lacked it, controlled for years of experience. `supplyIndex` is
 * what stops commoditised skills from scoring well: a skill everyone already
 * has cannot be arbitrage.
 */
export const SKILLS: readonly Skill[] = [
  {
    id: "typescript", name: "TypeScript", slug: "typescript", category: "language",
    learningHours: 60, baseLiftPct: 0.07, demandIndex: 0.88, supplyIndex: 0.72,
    strongForRoles: ["frontend-engineer", "fullstack-engineer", "product-engineer"],
    prerequisites: [], sampleSize: 4820, roadmapUrl: "https://roadmap.sh/typescript",
  },
  {
    id: "react", name: "React", slug: "react", category: "framework",
    learningHours: 80, baseLiftPct: 0.06, demandIndex: 0.85, supplyIndex: 0.78,
    strongForRoles: ["frontend-engineer", "fullstack-engineer"],
    prerequisites: ["typescript"], sampleSize: 6110, roadmapUrl: "https://roadmap.sh/react",
  },
  {
    id: "nextjs", name: "Next.js", slug: "nextjs", category: "framework",
    learningHours: 45, baseLiftPct: 0.08, demandIndex: 0.71, supplyIndex: 0.49,
    strongForRoles: ["frontend-engineer", "fullstack-engineer"],
    prerequisites: ["react"], sampleSize: 2140, roadmapUrl: "https://nextjs.org/learn",
  },
  {
    id: "graphql", name: "GraphQL", slug: "graphql", category: "platform",
    learningHours: 45, baseLiftPct: 0.11, demandIndex: 0.52, supplyIndex: 0.24,
    strongForRoles: ["frontend-engineer", "backend-engineer", "fullstack-engineer"],
    prerequisites: [], sampleSize: 1680, roadmapUrl: "https://graphql.org/learn/",
  },
  {
    id: "tailwind", name: "Tailwind CSS", slug: "tailwind", category: "framework",
    learningHours: 20, baseLiftPct: 0.02, demandIndex: 0.61, supplyIndex: 0.66,
    strongForRoles: ["frontend-engineer", "product-designer"],
    prerequisites: [], sampleSize: 1920, roadmapUrl: "https://tailwindcss.com/docs",
  },
  {
    id: "web-perf", name: "Web Performance (Core Web Vitals)", slug: "web-performance", category: "practice",
    learningHours: 55, baseLiftPct: 0.09, demandIndex: 0.44, supplyIndex: 0.17,
    strongForRoles: ["frontend-engineer", "fullstack-engineer"],
    prerequisites: [], sampleSize: 890, roadmapUrl: "https://web.dev/learn/performance",
  },
  {
    id: "accessibility", name: "Accessibility (WCAG 2.2)", slug: "accessibility", category: "practice",
    learningHours: 40, baseLiftPct: 0.06, demandIndex: 0.38, supplyIndex: 0.14,
    strongForRoles: ["frontend-engineer", "product-designer"],
    prerequisites: [], sampleSize: 640, roadmapUrl: "https://web.dev/learn/accessibility",
  },
  {
    id: "testing", name: "Automated Testing", slug: "testing", category: "practice",
    learningHours: 50, baseLiftPct: 0.05, demandIndex: 0.69, supplyIndex: 0.55,
    strongForRoles: ["frontend-engineer", "backend-engineer", "fullstack-engineer"],
    prerequisites: [], sampleSize: 3300, roadmapUrl: "https://testingjavascript.com",
  },
  {
    id: "node", name: "Node.js", slug: "nodejs", category: "platform",
    learningHours: 70, baseLiftPct: 0.07, demandIndex: 0.74, supplyIndex: 0.62,
    strongForRoles: ["fullstack-engineer", "backend-engineer"],
    prerequisites: ["typescript"], sampleSize: 4010, roadmapUrl: "https://roadmap.sh/nodejs",
  },
  {
    id: "go", name: "Go", slug: "go", category: "language",
    learningHours: 90, baseLiftPct: 0.13, demandIndex: 0.47, supplyIndex: 0.21,
    strongForRoles: ["backend-engineer", "platform-engineer", "security-engineer"],
    prerequisites: [], sampleSize: 1450, roadmapUrl: "https://roadmap.sh/golang",
  },
  {
    id: "rust", name: "Rust", slug: "rust", category: "language",
    learningHours: 180, baseLiftPct: 0.16, demandIndex: 0.29, supplyIndex: 0.09,
    strongForRoles: ["backend-engineer", "platform-engineer"],
    prerequisites: [], sampleSize: 720, roadmapUrl: "https://roadmap.sh/rust",
  },
  {
    id: "kubernetes", name: "Kubernetes", slug: "kubernetes", category: "platform",
    learningHours: 120, baseLiftPct: 0.14, demandIndex: 0.63, supplyIndex: 0.28,
    strongForRoles: ["platform-engineer", "backend-engineer", "ml-engineer", "security-engineer"],
    prerequisites: [], sampleSize: 2610, roadmapUrl: "https://roadmap.sh/kubernetes",
  },
  {
    id: "terraform", name: "Terraform / IaC", slug: "terraform", category: "platform",
    learningHours: 55, baseLiftPct: 0.10, demandIndex: 0.58, supplyIndex: 0.31,
    strongForRoles: ["platform-engineer", "backend-engineer", "security-engineer"],
    prerequisites: [], sampleSize: 1980, roadmapUrl: "https://developer.hashicorp.com/terraform/tutorials",
  },
  {
    id: "aws", name: "AWS", slug: "aws", category: "platform",
    learningHours: 100, baseLiftPct: 0.09, demandIndex: 0.81, supplyIndex: 0.58,
    strongForRoles: ["backend-engineer", "platform-engineer", "fullstack-engineer", "ml-engineer"],
    prerequisites: [], sampleSize: 5240, roadmapUrl: "https://roadmap.sh/aws",
  },
  {
    id: "postgres", name: "PostgreSQL", slug: "postgresql", category: "data",
    learningHours: 60, baseLiftPct: 0.06, demandIndex: 0.72, supplyIndex: 0.54,
    strongForRoles: ["backend-engineer", "fullstack-engineer", "analytics-engineer"],
    prerequisites: ["sql"], sampleSize: 3120, roadmapUrl: "https://roadmap.sh/postgresql-dba",
  },
  {
    id: "kafka", name: "Kafka / Event Streaming", slug: "kafka", category: "platform",
    learningHours: 80, baseLiftPct: 0.12, demandIndex: 0.41, supplyIndex: 0.16,
    strongForRoles: ["backend-engineer", "platform-engineer"],
    prerequisites: ["distributed-systems"], sampleSize: 1120, roadmapUrl: "https://developer.confluent.io/learn/",
  },
  {
    id: "system-design", name: "System Design", slug: "system-design", category: "practice",
    learningHours: 110, baseLiftPct: 0.15, demandIndex: 0.76, supplyIndex: 0.33,
    strongForRoles: ["backend-engineer", "frontend-engineer", "fullstack-engineer", "platform-engineer", "engineering-manager"],
    prerequisites: [], sampleSize: 4400, roadmapUrl: "https://roadmap.sh/system-design",
  },
  {
    id: "distributed-systems", name: "Distributed Systems", slug: "distributed-systems", category: "practice",
    learningHours: 140, baseLiftPct: 0.17, demandIndex: 0.39, supplyIndex: 0.12,
    strongForRoles: ["platform-engineer", "ml-engineer", "backend-engineer"],
    prerequisites: ["system-design"], sampleSize: 810, roadmapUrl: "https://roadmap.sh/system-design",
  },
  {
    id: "observability", name: "Observability (OTel)", slug: "observability", category: "practice",
    learningHours: 45, baseLiftPct: 0.08, demandIndex: 0.46, supplyIndex: 0.19,
    strongForRoles: ["platform-engineer", "backend-engineer", "security-engineer", "ml-engineer"],
    prerequisites: [], sampleSize: 940, roadmapUrl: "https://opentelemetry.io/docs/",
  },
  {
    id: "security-eng", name: "Application Security", slug: "application-security", category: "practice",
    learningHours: 130, baseLiftPct: 0.16, demandIndex: 0.51, supplyIndex: 0.14,
    strongForRoles: ["security-engineer", "backend-engineer", "platform-engineer"],
    prerequisites: [], sampleSize: 1060, roadmapUrl: "https://roadmap.sh/cyber-security",
  },
  {
    id: "compliance", name: "SOC 2 / ISO 27001 Compliance", slug: "compliance", category: "domain",
    learningHours: 60, baseLiftPct: 0.07, demandIndex: 0.33, supplyIndex: 0.11,
    strongForRoles: ["security-engineer", "engineering-manager"],
    prerequisites: [], sampleSize: 420, roadmapUrl: "https://roadmap.sh/cyber-security",
  },
  {
    id: "sql", name: "SQL", slug: "sql", category: "data",
    learningHours: 45, baseLiftPct: 0.06, demandIndex: 0.91, supplyIndex: 0.81,
    strongForRoles: ["data-analyst", "analytics-engineer", "data-scientist", "product-manager"],
    prerequisites: [], sampleSize: 7200, roadmapUrl: "https://roadmap.sh/sql",
  },
  {
    id: "python", name: "Python", slug: "python", category: "language",
    learningHours: 80, baseLiftPct: 0.08, demandIndex: 0.86, supplyIndex: 0.69,
    strongForRoles: ["data-analyst", "data-scientist", "ml-engineer", "security-engineer"],
    prerequisites: [], sampleSize: 6800, roadmapUrl: "https://roadmap.sh/python",
  },
  {
    id: "dbt", name: "dbt", slug: "dbt", category: "data",
    learningHours: 35, baseLiftPct: 0.13, demandIndex: 0.49, supplyIndex: 0.18,
    strongForRoles: ["data-analyst", "analytics-engineer"],
    prerequisites: ["sql"], sampleSize: 1340, roadmapUrl: "https://courses.getdbt.com",
  },
  {
    id: "snowflake", name: "Snowflake / Warehouse Ops", slug: "snowflake", category: "data",
    learningHours: 50, baseLiftPct: 0.10, demandIndex: 0.54, supplyIndex: 0.27,
    strongForRoles: ["analytics-engineer", "data-analyst"],
    prerequisites: ["sql"], sampleSize: 1210, roadmapUrl: "https://learn.snowflake.com",
  },
  {
    id: "airflow", name: "Airflow / Orchestration", slug: "airflow", category: "data",
    learningHours: 45, baseLiftPct: 0.09, demandIndex: 0.47, supplyIndex: 0.23,
    strongForRoles: ["analytics-engineer", "data-analyst", "ml-engineer"],
    prerequisites: ["python"], sampleSize: 980, roadmapUrl: "https://airflow.apache.org/docs/",
  },
  {
    id: "spark", name: "Spark", slug: "spark", category: "data",
    learningHours: 70, baseLiftPct: 0.11, demandIndex: 0.42, supplyIndex: 0.20,
    strongForRoles: ["data-scientist", "analytics-engineer", "ml-engineer"],
    prerequisites: ["python"], sampleSize: 1150, roadmapUrl: "https://spark.apache.org/docs/latest/",
  },
  {
    id: "tableau", name: "Tableau / BI Tooling", slug: "tableau", category: "data",
    learningHours: 30, baseLiftPct: 0.03, demandIndex: 0.56, supplyIndex: 0.63,
    strongForRoles: ["data-analyst"],
    prerequisites: [], sampleSize: 2400, roadmapUrl: "https://www.tableau.com/learn/training",
  },
  {
    id: "statistics", name: "Applied Statistics", slug: "statistics", category: "practice",
    learningHours: 90, baseLiftPct: 0.12, demandIndex: 0.51, supplyIndex: 0.22,
    strongForRoles: ["data-analyst", "data-scientist", "product-manager"],
    prerequisites: [], sampleSize: 1680, roadmapUrl: "https://roadmap.sh/ai-data-scientist",
  },
  {
    id: "experimentation", name: "Experimentation / A-B Testing", slug: "experimentation", category: "practice",
    learningHours: 40, baseLiftPct: 0.10, demandIndex: 0.45, supplyIndex: 0.19,
    strongForRoles: ["data-analyst", "product-manager", "data-scientist"],
    prerequisites: ["statistics"], sampleSize: 1020, roadmapUrl: "https://www.optimizely.com/optimization-glossary/ab-testing/",
  },
  {
    id: "ml-fundamentals", name: "ML Fundamentals", slug: "ml-fundamentals", category: "practice",
    learningHours: 120, baseLiftPct: 0.14, demandIndex: 0.58, supplyIndex: 0.26,
    strongForRoles: ["data-analyst", "data-scientist", "ml-engineer"],
    prerequisites: ["python", "statistics"], sampleSize: 2100, roadmapUrl: "https://roadmap.sh/ai-data-scientist",
  },
  {
    id: "pytorch", name: "PyTorch", slug: "pytorch", category: "framework",
    learningHours: 100, baseLiftPct: 0.15, demandIndex: 0.44, supplyIndex: 0.17,
    strongForRoles: ["ml-engineer", "data-scientist"],
    prerequisites: ["python", "ml-fundamentals"], sampleSize: 1130, roadmapUrl: "https://pytorch.org/tutorials/",
  },
  {
    id: "llm-engineering", name: "LLM / RAG Engineering", slug: "llm-engineering", category: "practice",
    learningHours: 70, baseLiftPct: 0.19, demandIndex: 0.68, supplyIndex: 0.15,
    strongForRoles: ["ml-engineer", "data-scientist", "fullstack-engineer", "product-manager"],
    prerequisites: ["python"], sampleSize: 1490, roadmapUrl: "https://roadmap.sh/ai-engineer",
  },
  {
    id: "mlops", name: "MLOps", slug: "mlops", category: "practice",
    learningHours: 95, baseLiftPct: 0.15, demandIndex: 0.49, supplyIndex: 0.16,
    strongForRoles: ["ml-engineer", "data-scientist"],
    prerequisites: ["python", "kubernetes"], sampleSize: 870, roadmapUrl: "https://roadmap.sh/mlops",
  },
  {
    id: "data-modelling", name: "Dimensional Data Modelling", slug: "data-modelling", category: "data",
    learningHours: 55, baseLiftPct: 0.11, demandIndex: 0.40, supplyIndex: 0.17,
    strongForRoles: ["analytics-engineer", "data-analyst"],
    prerequisites: ["sql"], sampleSize: 760, roadmapUrl: "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/",
  },
  {
    id: "product-analytics", name: "Product Analytics", slug: "product-analytics", category: "practice",
    learningHours: 35, baseLiftPct: 0.08, demandIndex: 0.52, supplyIndex: 0.29,
    strongForRoles: ["product-manager", "product-designer", "data-analyst"],
    prerequisites: [], sampleSize: 1240, roadmapUrl: "https://amplitude.com/blog/product-analytics",
  },
  {
    id: "pricing-strategy", name: "Pricing & Packaging", slug: "pricing-strategy", category: "domain",
    learningHours: 45, baseLiftPct: 0.13, demandIndex: 0.31, supplyIndex: 0.10,
    strongForRoles: ["product-manager", "engineering-manager"],
    prerequisites: [], sampleSize: 520, roadmapUrl: "https://www.priceintelligently.com/blog",
  },
  {
    id: "user-research", name: "User Research", slug: "user-research", category: "practice",
    learningHours: 50, baseLiftPct: 0.07, demandIndex: 0.42, supplyIndex: 0.30,
    strongForRoles: ["product-designer", "product-manager"],
    prerequisites: [], sampleSize: 960, roadmapUrl: "https://www.nngroup.com/topic/user-research-methods/",
  },
  {
    id: "design-systems", name: "Design Systems", slug: "design-systems", category: "practice",
    learningHours: 60, baseLiftPct: 0.12, demandIndex: 0.44, supplyIndex: 0.18,
    strongForRoles: ["product-designer", "frontend-engineer"],
    prerequisites: [], sampleSize: 730, roadmapUrl: "https://www.designsystems.com",
  },
  {
    id: "prototyping", name: "High-Fidelity Prototyping", slug: "prototyping", category: "practice",
    learningHours: 40, baseLiftPct: 0.06, demandIndex: 0.48, supplyIndex: 0.41,
    strongForRoles: ["product-designer"],
    prerequisites: [], sampleSize: 880, roadmapUrl: "https://www.figma.com/resources/learn-design/",
  },
  {
    id: "motion-design", name: "Interface Motion Design", slug: "motion-design", category: "practice",
    learningHours: 55, baseLiftPct: 0.09, demandIndex: 0.27, supplyIndex: 0.12,
    strongForRoles: ["product-designer", "frontend-engineer"],
    prerequisites: [], sampleSize: 340, roadmapUrl: "https://motion.dev/docs",
  },
  {
    id: "people-management", name: "People Management", slug: "people-management", category: "practice",
    learningHours: 120, baseLiftPct: 0.18, demandIndex: 0.36, supplyIndex: 0.15,
    strongForRoles: ["engineering-manager"],
    prerequisites: [], sampleSize: 610, roadmapUrl: "https://roadmap.sh/engineering-manager",
  },
] as const;

export const SKILL_BY_ID = new Map(SKILLS.map((s) => [s.id, s]));

export function getSkill(id: string): Skill | undefined {
  return SKILL_BY_ID.get(id);
}
