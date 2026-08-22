import { z } from "zod";
import { ROLES } from "@/data/roles";
import { SKILLS } from "@/data/skills";
import { MARKETS, FX_RATES } from "@/data/markets";

const roleIds = ROLES.map((r) => r.id) as [string, ...string[]];
const skillIds = SKILLS.map((s) => s.id) as [string, ...string[]];
const marketIds = MARKETS.map((m) => m.id) as [string, ...string[]];
const currencyCodes = FX_RATES.map((f) => f.code) as [string, ...string[]];

// ---------------------------------------------------------------------------
// Module A — Skill Arbitrage
// ---------------------------------------------------------------------------

export const skillArbitrageInputSchema = z.object({
  currentRoleId: z.enum(roleIds, { required_error: "Pick the role you hold today." }),
  currentSkillIds: z
    .array(z.enum(skillIds))
    .max(40, "That's more than we can score at once — trim to your strongest 40.")
    .default([]),
  targetRoleId: z.enum(roleIds).optional(),
  marketId: z.enum(marketIds, { required_error: "Pick the market you're paid in." }),
  currencyCode: z.enum(currencyCodes).default("USD"),
  yearsExperience: z
    .number({ invalid_type_error: "Years of experience must be a number." })
    .int("Use whole years.")
    .min(0)
    .max(45, "45 years is our ceiling — the model has no data past it.")
    .default(3),
  /** Hours a week the person can realistically study. Used for the timeline. */
  weeklyStudyHours: z.number().min(1).max(40).default(6),
});

export type SkillArbitrageInput = z.infer<typeof skillArbitrageInputSchema>;

// ---------------------------------------------------------------------------
// Module B — Remote Pay Equity
// ---------------------------------------------------------------------------

export const employmentStructureSchema = z.enum(["FULL_TIME", "CONTRACTOR"]);
export type EmploymentStructureValue = z.infer<typeof employmentStructureSchema>;

export const remotePayEquityInputSchema = z
  .object({
    baseOffer: z
      .number({ invalid_type_error: "Enter the offer as a number." })
      .positive("The offer has to be above zero.")
      .max(10_000_000, "That's outside the range this model covers."),
    offerCurrency: z.enum(currencyCodes).default("USD"),
    anchorMarketId: z.enum(marketIds, { required_error: "Where is the employer anchored?" }),
    livingMarketId: z.enum(marketIds, { required_error: "Where do you actually live?" }),
    employment: employmentStructureSchema.default("FULL_TIME"),
    roleId: z.enum(roleIds).optional(),
    /** Bonus and equity, annualised, in the offer currency. */
    variableComp: z.number().min(0).max(10_000_000).default(0),
  })
  .refine((v) => v.anchorMarketId !== v.livingMarketId, {
    message: "Anchor and living location match — there's no cross-border gap to price.",
    path: ["livingMarketId"],
  });

export type RemotePayEquityInput = z.infer<typeof remotePayEquityInputSchema>;

// ---------------------------------------------------------------------------
// Lead capture
// ---------------------------------------------------------------------------

export const leadCaptureSchema = z.object({
  email: z.string().min(1, "Enter your email.").email("That email doesn't look right."),
  currentRole: z.string().min(2, "Which role are you in?").max(80),
  yearsExperience: z.number().int().min(0).max(45),
  unlockedAsset: z.string().min(1),
  source: z.enum(["SKILL_ARBITRAGE", "REMOTE_PAY_EQUITY"]).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
});

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

export const postTagSchema = z.enum([
  "OFFER_REVIEW",
  "SALARY_TRANSPARENCY",
  "INTERVIEW_EXPERIENCE",
  "SKILL_ROADMAP",
  "REMOTE_WORK_LIFE",
]);
export type PostTagValue = z.infer<typeof postTagSchema>;

export const createPostSchema = z.object({
  title: z
    .string()
    .min(12, "Titles under 12 characters don't give readers enough to go on.")
    .max(300, "Keep the title under 300 characters."),
  content: z
    .string()
    .min(40, "Add at least a couple of sentences — thin posts get buried.")
    .max(20_000, "That's past the 20,000 character limit."),
  tags: z.array(postTagSchema).min(1, "Pick at least one channel.").max(3, "Three channels max."),
  isAnonymous: z.boolean().default(false),
  calculationId: z.string().cuid().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createCommentSchema = z.object({
  postId: z.string().cuid(),
  parentId: z.string().cuid().optional(),
  content: z.string().min(2, "Say something.").max(10_000),
  isAnonymous: z.boolean().default(false),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const voteSchema = z
  .object({
    value: z.enum(["UP", "DOWN"]),
    postId: z.string().cuid().optional(),
    commentId: z.string().cuid().optional(),
  })
  .refine((v) => Boolean(v.postId) !== Boolean(v.commentId), {
    message: "A vote targets exactly one post or one comment.",
  });
