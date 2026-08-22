/**
 * The phrase dictionary behind the JD Simplifier.
 *
 * Every entry is a literal pattern plus the plain-English thing it usually
 * means. Nothing here is inferred at runtime: if the tool flags a phrase, that
 * phrase is in the posting and can be highlighted back to the reader. That is
 * the whole point — a red flag you can't point at is just an opinion.
 *
 * `meaning` is written to be fair rather than cynical. Several of these
 * phrases are used innocently by small companies with no recruiting function,
 * and the copy says so where that's true.
 */

export type FlagSeverity = "high" | "medium" | "low";

export type FlagCategory =
  | "compensation"
  | "workload"
  | "stability"
  | "process"
  | "culture"
  | "commitment";

export interface JdSignal {
  id: string;
  /** Case-insensitive source for a word-boundary regex. */
  pattern: string;
  /** What the posting says. */
  label: string;
  /** What it usually means, in plain English. */
  meaning: string;
  severity: FlagSeverity;
  category: FlagCategory;
  /** What to ask, if they still want the job. */
  ask?: string;
}

export const RED_FLAGS: readonly JdSignal[] = [
  // ---------------------------------------------------------------- pay
  {
    id: "competitive-salary",
    pattern: "competitive (?:salary|compensation|pay|package)",
    label: "\u201cCompetitive salary\u201d",
    meaning:
      "This is not a number. Postings that disclose a range attract better candidates, so leaving it out is usually a choice \u2014 either the range is below market, or they want to anchor to your current pay.",
    severity: "medium",
    category: "compensation",
    ask: "What is the budgeted range for this level?",
  },
  {
    id: "salary-commensurate",
    pattern: "(?:salary|compensation) (?:is )?commensurate with experience",
    label: "\u201cCommensurate with experience\u201d",
    meaning:
      "The same as no range, phrased more formally. It also signals that pay will be negotiated individually rather than banded, which tends to disadvantage whoever negotiates less.",
    severity: "medium",
    category: "compensation",
    ask: "What did the last person hired into this level start at?",
  },
  {
    id: "equity-in-lieu",
    pattern: "equity in lieu|(?:sweat|deferred) equity|below[- ]market.{0,20}equity",
    label: "Equity offered instead of salary",
    meaning:
      "You are being asked to fund the company by taking less cash. Private equity is illiquid, frequently worth nothing, and cannot pay rent. Treat the cash figure as the offer.",
    severity: "high",
    category: "compensation",
    ask: "What is the strike price, the current 409A, and the total outstanding share count?",
  },
  {
    id: "commission-only",
    pattern: "commission[- ]only|100% commission|unpaid.{0,15}(?:internship|training)",
    label: "Unpaid or commission-only",
    meaning:
      "No guaranteed income. In most jurisdictions unpaid work for a for-profit company that produces value is not lawful, whatever the posting calls it.",
    severity: "high",
    category: "compensation",
  },
  {
    id: "own-equipment",
    pattern: "(?:own|personal) (?:laptop|device|equipment)|bring your own device|byod",
    label: "You supply your own equipment",
    meaning:
      "A company that cannot fund a laptop is telling you something about its cash position, and you are absorbing a real cost out of your salary.",
    severity: "medium",
    category: "compensation",
  },

  // ------------------------------------------------------------ workload
  {
    id: "many-hats",
    pattern: "wear(?:ing)? (?:many|multiple|several) hats|jack of all trades",
    label: "\u201cWear many hats\u201d",
    meaning:
      "The role covers work that would elsewhere be several jobs. Genuinely fine at an early-stage company if you want the breadth \u2014 draining if you expected to go deep on one craft.",
    severity: "low",
    category: "workload",
    ask: "Which parts of this role are actually mine, and which are shared?",
  },
  {
    id: "fast-paced",
    pattern: "fast[- ]paced|high[- ]velocity|move fast and",
    label: "\u201cFast-paced environment\u201d",
    meaning:
      "Nearly universal, so weak on its own. It matters when it appears alongside other workload flags \u2014 together they usually describe chronic under-resourcing rather than energy.",
    severity: "low",
    category: "workload",
  },
  {
    id: "work-hard-play-hard",
    pattern: "work hard,? play hard|hustle|grind|no[- ]nonsense.{0,12}hours",
    label: "\u201cWork hard, play hard\u201d",
    meaning:
      "Long hours framed as culture. The social events are not compensation for the overtime.",
    severity: "medium",
    category: "workload",
  },
  {
    id: "under-pressure",
    pattern: "work(?:s|ing)? (?:well )?under pressure|thrive(?:s)? under pressure|tight deadlines",
    label: "\u201cWorks well under pressure\u201d",
    meaning:
      "Deadline pressure is being described as a permanent feature rather than an occasional crunch.",
    severity: "low",
    category: "workload",
  },
  {
    id: "on-call",
    pattern: "on[- ]call|pager duty|24/?7 (?:support|availability)|rotational shift|night shift",
    label: "On-call or shift work",
    meaning:
      "Out-of-hours availability is part of the job. Whether that is fair depends entirely on the rotation size and whether it is paid \u2014 neither of which the posting says.",
    severity: "medium",
    category: "workload",
    ask: "How many people are in the rotation, and how is on-call compensated?",
  },
  {
    id: "hit-ground-running",
    pattern: "hit the ground running|no hand[- ]holding|minimal (?:supervision|guidance)|self[- ]starter",
    label: "\u201cHit the ground running\u201d",
    meaning:
      "There is no onboarding plan and possibly nobody to ask. Hard on anyone early in their career, regardless of ability.",
    severity: "medium",
    category: "process",
    ask: "Who will I learn the system from in my first month?",
  },

  // ----------------------------------------------------------- stability
  {
    id: "rapidly-changing",
    pattern: "rapidly (?:changing|evolving)|comfortable with ambiguity|shifting priorities|constantly changing",
    label: "\u201cComfortable with ambiguity\u201d",
    meaning:
      "Priorities change often. Sometimes that is honest early-stage life; sometimes it means work gets abandoned before it ships.",
    severity: "low",
    category: "stability",
  },
  {
    id: "family",
    pattern: "we(?:'| a)re (?:a|like a) family|family[- ]like (?:culture|environment)",
    label: "\u201cWe're a family\u201d",
    meaning:
      "Families do not conduct layoffs or performance reviews. This framing is commonly used to make ordinary boundaries \u2014 declining weekend work, taking leave \u2014 feel like betrayal.",
    severity: "medium",
    category: "culture",
  },
  {
    id: "rockstar",
    pattern: "rock ?star|ninja|guru|wizard|10x (?:engineer|developer)|superhero",
    label: "\u201cRockstar / ninja / 10x\u201d",
    meaning:
      "Usually just an unserious job posting. It does correlate with individual-hero expectations rather than functioning teams, and with hiring processes that lack structure.",
    severity: "low",
    category: "culture",
  },
  {
    id: "unlimited-pto",
    pattern: "unlimited (?:pto|vacation|holiday|leave)",
    label: "\u201cUnlimited PTO\u201d",
    meaning:
      "Worth checking rather than assuming. Unlimited policies remove the accrued balance the company would owe you on exit, and measured usage under them is often lower than under fixed allowances.",
    severity: "low",
    category: "culture",
    ask: "How many days did the team actually take last year?",
  },

  // ---------------------------------------------------------- commitment
  {
    id: "bond",
    pattern: "(?:service )?bond|minimum (?:service|tenure)|lock[- ]in period|\\b(?:1|2|3|one|two|three)[- ]year (?:bond|commitment)",
    label: "Employment bond or lock-in",
    meaning:
      "You would owe money to leave. Enforceability varies by jurisdiction and these agreements are frequently struck down, but defending yourself still costs time and legal fees.",
    severity: "high",
    category: "commitment",
    ask: "What is the exact amount, and what triggers it?",
  },
  {
    id: "unpaid-trial",
    pattern: "unpaid (?:trial|test|assignment|project)|spec work|free trial period|probation.{0,20}(?:without|no) (?:pay|salary)",
    label: "Unpaid trial or spec work",
    meaning:
      "You would produce real work for free. A paid trial is reasonable; an unpaid one transfers your risk to you entirely.",
    severity: "high",
    category: "process",
  },
  {
    id: "immediate-joiner",
    pattern: "immediate joiner|join(?:ing)? immediately|(?:0|zero)[- ]?(?:day|days) notice|serving notice period only",
    label: "\u201cImmediate joiners only\u201d",
    meaning:
      "This excludes anyone currently employed with a notice period, which is most experienced people. It usually signals a backfill emergency rather than planned hiring.",
    severity: "medium",
    category: "stability",
  },
  {
    id: "relocate-own-expense",
    pattern: "relocat(?:e|ion).{0,30}(?:own expense|not (?:provided|covered)|self[- ]funded)",
    label: "Relocation at your own cost",
    meaning:
      "A significant expense pushed onto you before you have earned anything, and it makes leaving in the first year much harder.",
    severity: "medium",
    category: "commitment",
  },
  {
    id: "non-compete",
    pattern: "non[- ]compete|restraint of trade|shall not (?:work|engage).{0,40}competitor",
    label: "Non-compete mentioned",
    meaning:
      "A restriction on your next job, written into this one. Enforceability differs sharply by jurisdiction, so read the scope and duration before signing anything.",
    severity: "medium",
    category: "commitment",
  },
  {
    id: "high-variable",
    pattern: "variable (?:component|pay|payout)|performance[- ]linked (?:pay|incentive)|\\bCTC includes\\b|inclusive of variable",
    label: "Large variable component in CTC",
    meaning:
      "A CTC quoted with a big variable share overstates what you can count on. Where variable runs past about a quarter of the package, your guaranteed pay is materially lower than the headline.",
    severity: "medium",
    category: "compensation",
    ask: "What is the fixed component, and what percentage of variable was actually paid out last year?",
  },
  {
    id: "industry-standards",
    pattern: "as per (?:industry|company|market) (?:standards?|norms?)|best in industry|no bar for (?:the )?right candidate",
    label: "\u201cAs per industry standards\u201d",
    meaning:
      "Another way of naming no number. \u201cNo bar for the right candidate\u201d is the same move in reverse \u2014 it invites you to anchor yourself, usually low.",
    severity: "medium",
    category: "compensation",
    ask: "What range is budgeted for this role at my level?",
  },
  {
    id: "notice-buyout",
    pattern: "notice period buyout not|buyout not (?:available|provided|supported)|must serve (?:full|entire) notice",
    label: "No notice period buyout",
    meaning:
      "If your current employer requires a long notice period, this either delays your start by months or forces you to pay the buyout yourself.",
    severity: "low",
    category: "commitment",
  },
  {
    id: "own-conveyance",
    pattern: "own (?:vehicle|conveyance|two[- ]wheeler|bike|car)|must have (?:a )?(?:bike|vehicle)",
    label: "Own vehicle required",
    meaning:
      "Fuel, maintenance and insurance come out of your salary. Ask whether travel is reimbursed and at what rate.",
    severity: "medium",
    category: "compensation",
    ask: "Is travel reimbursed, and at what per-kilometre rate?",
  },
  {
    id: "target-based",
    pattern: "target[- ]based (?:pay|incentive|role)|achieve monthly targets|revenue targets? (?:must|to be) (?:met|achieved)",
    label: "Pay tied to targets",
    meaning:
      "Some of your income depends on hitting numbers you may not control. Worth knowing what share of the team hit target last year.",
    severity: "medium",
    category: "compensation",
    ask: "What proportion of the team hit target last year?",
  },
  {
    id: "six-day",
    pattern: "6 days? a week|six days? a week|monday to saturday|mon[- ]sat|alternate saturdays?",
    label: "Six-day week",
    meaning:
      "A sixth working day is roughly 20% more of your life for the same salary. Compare the offer per hour, not per year.",
    severity: "medium",
    category: "workload",
  },
  {
    id: "no-appraisal-clarity",
    pattern: "appraisal (?:as per|at) (?:company )?(?:policy|discretion)|hikes? (?:are )?(?:as per|subject to) (?:company )?discretion",
    label: "Appraisals at company discretion",
    meaning:
      "No stated review cycle. A company that cannot say when pay is reviewed usually reviews it late.",
    severity: "low",
    category: "stability",
    ask: "When is the review cycle, and what was the average hike last year?",
  },
  {
    id: "salary-history",
    pattern: "(?:current|last drawn) (?:ctc|salary) (?:is )?(?:mandatory|required)|share (?:your )?(?:payslip|salary slip)s?|salary slip.{0,20}mandatory",
    label: "Current salary demanded up front",
    meaning:
      "Asking your current pay before making an offer anchors the offer to your past salary rather than the role's value. It is restricted or banned in several jurisdictions for that reason.",
    severity: "medium",
    category: "process",
    ask: "What is the budgeted range for this role, independent of my current pay?",
  },
];

/**
 * Things worth noticing that are actually good. A tool that only finds fault
 * teaches people to distrust every posting, which is both wrong and useless.
 */
export const GREEN_FLAGS: readonly JdSignal[] = [
  {
    id: "posted-range",
    pattern: "salary range|pay range|base (?:salary|range) of|budgeted (?:at|range)",
    label: "Pay range disclosed",
    meaning: "They named a number before you asked. That correlates with banded pay and fewer negotiation games.",
    severity: "low",
    category: "compensation",
  },
  {
    id: "structured-process",
    pattern: "interview process|what to expect|hiring process|take[- ]home.{0,20}paid|paid (?:trial|assignment)",
    label: "Interview process explained",
    meaning: "They have thought about your time. Written processes also tend to mean more consistent evaluation.",
    severity: "low",
    category: "process",
  },
  {
    id: "learning-budget",
    pattern: "learning (?:budget|stipend)|conference budget|professional development budget|education (?:stipend|allowance)",
    label: "Learning budget",
    meaning: "Training is funded rather than expected on your own weekends.",
    severity: "low",
    category: "culture",
  },
  {
    id: "async",
    pattern: "async(?:hronous)? (?:by default|first|culture)|documented|no meeting|meeting[- ]light",
    label: "Async or documentation culture",
    meaning: "Usually means work is written down, which makes onboarding survivable and reduces hours lost to meetings.",
    severity: "low",
    category: "process",
  },
  {
    id: "parental-leave",
    pattern: "parental leave|maternity leave|paternity leave|caregiver leave",
    label: "Parental leave stated",
    meaning: "A concrete benefit they were willing to commit to in writing.",
    severity: "low",
    category: "culture",
  },
  {
    id: "fixed-ctc",
    pattern: "fixed (?:ctc|component|pay)|100% fixed|no variable component",
    label: "Fixed pay, no variable",
    meaning: "The whole package is guaranteed. Rarer than it should be, and worth a lot.",
    severity: "low",
    category: "compensation",
  },
  {
    id: "review-cycle",
    pattern: "annual (?:review|appraisal) cycle|reviewed (?:every|twice) (?:year|6 months)|bi[- ]annual review",
    label: "Stated review cycle",
    meaning: "They committed in writing to when your pay gets looked at.",
    severity: "low",
    category: "stability",
  },
  {
    id: "four-day",
    pattern: "four[- ]day (?:week|work week)|4[- ]day (?:week|work week)|9[- ]day fortnight",
    label: "Compressed week",
    meaning: "A rare and material benefit, and one that is hard to fake.",
    severity: "low",
    category: "workload",
  },
];

/**
 * Aliases the skill dataset doesn't carry. Keys map to a skill id in
 * `src/data/skills.ts`.
 */
export const SKILL_ALIASES: Readonly<Record<string, string>> = {
  js: "javascript",
  ts: "typescript",
  "react.js": "react",
  reactjs: "react",
  "next.js": "nextjs",
  next: "nextjs",
  "node.js": "nodejs",
  node: "nodejs",
  postgres: "postgresql",
  psql: "postgresql",
  k8s: "kubernetes",
  gcp: "google-cloud",
  tf: "terraform",
  "c#": "csharp",
  golang: "go",
  ml: "machine-learning",
  "ci/cd": "cicd",
  a11y: "accessibility",
};
