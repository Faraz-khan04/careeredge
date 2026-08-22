import { SKILLS } from "@/data/skills";

export const FUNNEL_ENGINE_VERSION = "1.0.0";

/**
 * Stages a candidate can actually observe.
 *
 * There is deliberately no "rejected by ATS" stage. From outside a company
 * you cannot tell whether a filter, a recruiter or a hiring freeze ended an
 * application, and inventing that distinction would be the single most
 * misleading thing this tool could do.
 */
export type Stage =
  | "applied"
  | "screened"
  | "interviewed"
  | "final"
  | "offered"
  | "rejected"
  | "withdrawn";

export const STAGE_LABEL: Record<Stage, string> = {
  applied: "Applied",
  screened: "Recruiter call",
  interviewed: "Interviewed",
  final: "Final round",
  offered: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrew",
};

/** Ordered progress stages. Rejected and withdrawn are outcomes, not steps. */
export const PROGRESS_STAGES: Stage[] = ["applied", "screened", "interviewed", "final", "offered"];

export interface Application {
  id: string;
  company: string;
  role: string;
  /** ISO date string. */
  appliedOn: string;
  stage: Stage;
  /** Furthest stage reached before a rejection, if any. */
  reachedStage: Stage;
  /** Skills the posting asked for, as skill ids where we recognise them. */
  requiredSkills: string[];
  /** Where you applied: LinkedIn, Naukri, referral, company site. */
  source: string;
  /** ISO date of the first human reply, if one came. */
  firstReplyOn?: string;
  /** CTC or salary quoted in the posting, in rupees. */
  ctcQuoted?: number;
  notes: string;
}

export interface SourceStat {
  source: string;
  applied: number;
  replied: number;
  interviewed: number;
  /** Only meaningful once `applied` is reasonably large. */
  replyRate: number;
  /** False below ten applications from this source. */
  readable: boolean;
}

export interface SkillGap {
  skillId: string;
  name: string;
  /** How many of your applications asked for it. */
  askedIn: number;
  /** Share of applications, 0–1. */
  share: number;
  held: boolean;
}

export interface FunnelResult {
  total: number;
  /** Applications with no reply at all, older than three weeks. */
  silent: number;
  byStage: Record<Stage, number>;

  /** Reached at least a recruiter call. */
  responseRate: number;
  /** Reached at least an interview. */
  interviewRate: number;
  offerRate: number;

  /** Median days from applying to first response, where one came. */
  medianDaysToReply: number | null;

  /**
   * How much weight the numbers above can carry. Below 20 applications the
   * tool reports counts and declines to draw conclusions, because at that
   * sample size any pattern it found would be noise.
   */
  confidence: "too-early" | "indicative" | "reasonable";
  readable: boolean;

  /** Applications with no reply after three weeks, oldest first. */
  needsFollowUp: Application[];
  bySource: SourceStat[];

  gaps: SkillGap[];
  /** Plain observations. Every one is a fact about what you logged. */
  observations: string[];

  engineVersion: string;
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Summarises a set of applications.
 *
 * Everything returned is a count or a ratio of things the user recorded
 * themselves. Nothing here infers why an application ended — that is not
 * knowable from this data, and a tool that pretends otherwise sends people
 * to fix problems they may not have.
 */
export function analyseFunnel(apps: Application[], heldSkillIds: string[]): FunnelResult {
  const total = apps.length;

  const byStage = Object.fromEntries(
    (Object.keys(STAGE_LABEL) as Stage[]).map((s) => [s, 0]),
  ) as Record<Stage, number>;

  for (const a of apps) byStage[a.stage] += 1;

  const rank = (s: Stage) => {
    const i = PROGRESS_STAGES.indexOf(s);
    return i === -1 ? 0 : i;
  };

  const reachedAtLeast = (s: Stage) =>
    apps.filter((a) => rank(a.reachedStage) >= rank(s)).length;

  const now = Date.now();
  const needsFollowUp = apps
    .filter(
      (a) =>
        a.stage === "applied" &&
        a.reachedStage === "applied" &&
        now - new Date(a.appliedOn).getTime() > 21 * DAY,
    )
    .sort((a, b) => new Date(a.appliedOn).getTime() - new Date(b.appliedOn).getTime());

  const silent = needsFollowUp.length;

  // --------------------------------------------------- time to reply
  const replyDays = apps
    .filter((a) => a.firstReplyOn)
    .map(
      (a) =>
        (new Date(a.firstReplyOn!).getTime() - new Date(a.appliedOn).getTime()) / DAY,
    )
    .filter((d) => d >= 0 && d < 400)
    .sort((a, b) => a - b);

  const medianDaysToReply = replyDays.length
    ? Math.round(replyDays[Math.floor(replyDays.length / 2)]!)
    : null;

  // ----------------------------------------------------- by source
  const sourceMap = new Map<string, { applied: number; replied: number; interviewed: number }>();
  for (const a of apps) {
    const key = a.source.trim() || "Not recorded";
    const entry = sourceMap.get(key) ?? { applied: 0, replied: 0, interviewed: 0 };
    entry.applied += 1;
    if (rank(a.reachedStage) >= rank("screened")) entry.replied += 1;
    if (rank(a.reachedStage) >= rank("interviewed")) entry.interviewed += 1;
    sourceMap.set(key, entry);
  }

  const bySource: SourceStat[] = [...sourceMap.entries()]
    .map(([source, v]) => ({
      source,
      ...v,
      replyRate: v.applied ? v.replied / v.applied : 0,
      // Ten is already generous. Below it, one reply moves the rate by ten
      // points and the ordering is meaningless.
      readable: v.applied >= 10,
    }))
    .sort((a, b) => b.applied - a.applied);

  // ------------------------------------------------------------- gaps
  const counts = new Map<string, number>();
  for (const a of apps) {
    for (const id of new Set(a.requiredSkills)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const held = new Set(heldSkillIds);
  const gaps: SkillGap[] = [...counts.entries()]
    .map(([skillId, askedIn]) => ({
      skillId,
      name: SKILLS.find((s) => s.id === skillId)?.name ?? skillId,
      askedIn,
      share: total ? askedIn / total : 0,
      held: held.has(skillId),
    }))
    .sort((a, b) => b.askedIn - a.askedIn);

  // ------------------------------------------------------- confidence
  const confidence: FunnelResult["confidence"] =
    total < 20 ? "too-early" : total < 50 ? "indicative" : "reasonable";

  const responseRate = total ? reachedAtLeast("screened") / total : 0;
  const interviewRate = total ? reachedAtLeast("interviewed") / total : 0;
  const offerRate = total ? reachedAtLeast("offered") / total : 0;

  // --------------------------------------------------- observations
  const observations: string[] = [];

  if (total > 0 && confidence === "too-early") {
    observations.push(
      `${total} application${total === 1 ? "" : "s"} logged. Rates start to mean something around 20 — below that, one outcome either way swings the percentage wildly.`,
    );
  }

  if (silent > 0) {
    observations.push(
      `${silent} application${silent === 1 ? " has" : "s have"} had no reply after three weeks. That is normal and usually says nothing about you — most postings receive hundreds of applications and many are filled internally.`,
    );
  }

  const missing = gaps.filter((g) => !g.held && g.share >= 0.4);
  for (const g of missing.slice(0, 3)) {
    observations.push(
      `${g.name} was asked for in ${g.askedIn} of your ${total} applications and is not in your stack. That is a fact about the postings you chose, not a reason any of them said no.`,
    );
  }

  if (medianDaysToReply !== null) {
    observations.push(
      `Where a reply came, it took a median of ${medianDaysToReply} days. Anything much older than that is unlikely to move on its own.`,
    );
  }

  const readableSources = bySource.filter((s) => s.readable);
  if (readableSources.length >= 2) {
    const best = readableSources[0]!;
    const worst = readableSources[readableSources.length - 1]!;
    if (best.replyRate > worst.replyRate * 1.5) {
      observations.push(
        `${best.source} has replied to ${best.replied} of ${best.applied}, against ${worst.replied} of ${worst.applied} from ${worst.source}. Both samples are small, so treat this as a hint about where to spend your time rather than a finding.`,
      );
    }
  }

  if (confidence !== "too-early" && responseRate > 0 && interviewRate / responseRate < 0.35) {
    observations.push(
      "You are getting recruiter calls but fewer interviews follow. That gap is worth examining — though from this data alone we cannot tell you why.",
    );
  }

  return {
    total,
    silent,
    byStage,
    responseRate,
    interviewRate,
    offerRate,
    medianDaysToReply,
    confidence,
    readable: confidence !== "too-early",
    needsFollowUp,
    bySource,
    gaps,
    observations,
    engineVersion: FUNNEL_ENGINE_VERSION,
  };
}

/**
 * Rough published ranges for context, clearly not our own data.
 *
 * We have no user base to benchmark against yet, and inventing a benchmark
 * would be worse than offering none. Replace these with real aggregates once
 * enough people are tracking — and say so when you do.
 */
export const TYPICAL_RANGES = {
  responseRate: [0.03, 0.15] as const,
  interviewRate: [0.02, 0.08] as const,
  offerRate: [0.005, 0.03] as const,
};
