import { getRole } from "@/data/roles";
import { SKILLS, getSkill } from "@/data/skills";
import { getMarket, fromUsd, currencySymbol } from "@/data/markets";
import type { SkillArbitrageInput } from "@/lib/schemas";
import type {
  ArbitrageRecommendation,
  Confidence,
  Skill,
  SkillArbitrageResult,
} from "@/types";

export const SKILL_ARBITRAGE_ENGINE_VERSION = "1.0.0";

/** Lift is measured on roles in `strongForRoles`; elsewhere it transfers partially. */
const CROSS_ROLE_AFFINITY = 0.55;
/** Lift for a skill on the target role's list when you're not in that role yet. */
const TARGET_ROLE_AFFINITY = 0.85;

/**
 * Seniority curve. Juniors learn a first framework faster than a staff engineer
 * learns their eighth, but seniors convert a skill into comp more reliably.
 */
function seniorityLearningFactor(yearsExperience: number): number {
  if (yearsExperience <= 1) return 1.15;
  if (yearsExperience <= 3) return 1.0;
  if (yearsExperience <= 6) return 0.9;
  if (yearsExperience <= 10) return 0.82;
  return 0.78;
}

function seniorityLiftFactor(yearsExperience: number): number {
  if (yearsExperience <= 1) return 0.72;
  if (yearsExperience <= 3) return 0.9;
  if (yearsExperience <= 6) return 1.0;
  if (yearsExperience <= 10) return 1.08;
  return 1.12;
}

function confidenceFor(sampleSize: number): Confidence {
  if (sampleSize >= 1500) return "high";
  if (sampleSize >= 700) return "medium";
  return "low";
}

/**
 * Scarcity premium. A skill with heavy demand and thin supply pays more than
 * its raw median suggests; a commoditised one pays less than the median implies
 * because it has become table stakes rather than a differentiator.
 */
function scarcityMultiplier(skill: Skill): number {
  const ratio = skill.demandIndex / Math.max(skill.supplyIndex, 0.05);
  // ratio ~1 → neutral, ratio 4+ → strong premium, ratio <0.8 → discount.
  return Math.min(1.45, Math.max(0.62, 0.72 + 0.28 * Math.log2(ratio + 1)));
}

/** Holding the prerequisites shortens the runway; missing them lengthens it. */
function prerequisiteFactor(skill: Skill, held: ReadonlySet<string>): number {
  if (skill.prerequisites.length === 0) return 1;
  const covered = skill.prerequisites.filter((p) => held.has(p)).length;
  const coverage = covered / skill.prerequisites.length;
  // Full coverage → 25% faster. No coverage → 35% slower.
  return 1.35 - 0.6 * coverage;
}

function quadrantFor(
  effectiveHours: number,
  liftPct: number,
): ArbitrageRecommendation["quadrant"] {
  const lowEffort = effectiveHours <= 70;
  const highReturn = liftPct >= 0.09;
  if (lowEffort && highReturn) return "quick-win";
  if (!lowEffort && highReturn) return "strategic";
  if (lowEffort && !highReturn) return "incremental";
  return "long-haul";
}

function buildRationale(
  skill: Skill,
  liftPct: number,
  effectiveHours: number,
  hasPrereqs: boolean,
): string {
  const demand = Math.round(skill.demandIndex * 100);
  const supply = Math.round(skill.supplyIndex * 100);
  const scarcity =
    supply < 20
      ? `only ${supply}% of candidates in this track list it`
      : `${supply}% of the candidate pool already lists it`;
  const prereq = hasPrereqs
    ? " Your current stack covers the prerequisites, so the runway is shorter than the published estimate."
    : "";
  return (
    `${demand}% of postings for this track ask for ${skill.name} and ${scarcity}. ` +
    `That gap is what produces the ${Math.round(liftPct * 100)}% median lift over roughly ` +
    `${Math.round(effectiveHours)} focused hours.${prereq}`
  );
}

export function calculateSkillArbitrage(
  input: SkillArbitrageInput,
): SkillArbitrageResult {
  const currentRole = getRole(input.currentRoleId);
  const market = getMarket(input.marketId);
  if (!currentRole || !market) {
    throw new Error("Unknown role or market id — reference data is out of sync.");
  }
  const targetRole = input.targetRoleId ? getRole(input.targetRoleId) : undefined;

  const held = new Set(input.currentSkillIds);
  const symbol = currencySymbol(input.currencyCode);

  // Base pay in the user's own market and currency.
  const baseSalaryUsd = currentRole.baseSalaryUsd * market.salaryMultiplier;
  const baseSalary = fromUsd(baseSalaryUsd, input.currencyCode);

  // Candidate pool: everything relevant to the current role, plus the target
  // role's requirements when someone is aiming at a transition.
  const candidateIds = new Set<string>([
    ...currentRole.relevantSkills,
    ...(targetRole?.relevantSkills ?? []),
  ]);

  const learningFactor = seniorityLearningFactor(input.yearsExperience);
  const liftFactor = seniorityLiftFactor(input.yearsExperience);

  const recommendations: ArbitrageRecommendation[] = [];

  for (const skillId of candidateIds) {
    if (held.has(skillId)) continue;
    const skill = getSkill(skillId);
    if (!skill) continue;

    // --- Return side -------------------------------------------------------
    const strongForCurrent = skill.strongForRoles.includes(currentRole.id);
    const strongForTarget = targetRole
      ? skill.strongForRoles.includes(targetRole.id)
      : false;
    const affinity = strongForCurrent
      ? 1
      : strongForTarget
        ? TARGET_ROLE_AFFINITY
        : CROSS_ROLE_AFFINITY;

    const liftPct = skill.baseLiftPct * affinity * scarcityMultiplier(skill) * liftFactor;
    const salaryLift = baseSalary * liftPct;

    // --- Effort side -------------------------------------------------------
    const prereqFactor = prerequisiteFactor(skill, held);
    const effectiveHours = Math.max(
      8,
      Math.round(skill.learningHours * prereqFactor * learningFactor),
    );

    const arbitrageIndex = (salaryLift / effectiveHours) * 100;
    const hasPrereqs =
      skill.prerequisites.length > 0 && skill.prerequisites.every((p) => held.has(p));

    recommendations.push({
      skillId: skill.id,
      skillName: skill.name,
      skillSlug: skill.slug,
      category: skill.category,
      liftPct,
      salaryLift,
      effectiveHours,
      baseHours: skill.learningHours,
      arbitrageIndex,
      normalisedScore: 0, // filled in below, once the field is known
      quadrant: quadrantFor(effectiveHours, liftPct),
      confidence: confidenceFor(skill.sampleSize),
      rationale: buildRationale(skill, liftPct, effectiveHours, hasPrereqs),
      roadmapUrl: skill.roadmapUrl,
    });
  }

  recommendations.sort((a, b) => b.arbitrageIndex - a.arbitrageIndex);

  const best = recommendations[0]?.arbitrageIndex ?? 0;
  for (const rec of recommendations) {
    rec.normalisedScore = best > 0 ? Math.round((rec.arbitrageIndex / best) * 100) : 0;
  }

  // Stacked lift with overlap decay: the second and third skills land on a
  // salary already raised by the first, and their signals partly overlap.
  const OVERLAP_DECAY = [1, 0.78, 0.6];
  const topThree = recommendations.slice(0, 3);
  let stackedPct = 0;
  let totalHours = 0;
  topThree.forEach((rec, i) => {
    stackedPct += rec.liftPct * (OVERLAP_DECAY[i] ?? 0.5);
    totalHours += rec.effectiveHours;
  });

  const hourlyReturns = recommendations
    .map((r) => r.salaryLift / r.effectiveHours)
    .sort((a, b) => a - b);
  const mid = Math.floor(hourlyReturns.length / 2);
  const medianHourlyReturn =
    hourlyReturns.length === 0
      ? 0
      : hourlyReturns.length % 2 === 1
        ? (hourlyReturns[mid] ?? 0)
        : ((hourlyReturns[mid - 1] ?? 0) + (hourlyReturns[mid] ?? 0)) / 2;

  return {
    engineVersion: SKILL_ARBITRAGE_ENGINE_VERSION,
    currencyCode: input.currencyCode,
    currencySymbol: symbol,
    baseSalary,
    targetRoleName: targetRole?.name ?? null,
    recommendations,
    stackedLift: {
      liftPct: stackedPct,
      salaryLift: baseSalary * stackedPct,
      totalHours,
    },
    medianHourlyReturn,
  };
}

/** Weeks to work through a plan at the user's stated study pace. */
export function weeksToComplete(hours: number, weeklyStudyHours: number): number {
  return Math.ceil(hours / Math.max(weeklyStudyHours, 1));
}

/** Every skill in the catalogue, for the multi-select. */
export const ALL_SKILL_OPTIONS = SKILLS.map((s) => ({
  value: s.id,
  label: s.name,
  category: s.category,
}));
