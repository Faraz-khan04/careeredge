/* eslint-disable no-console */
import "dotenv/config";

import { PrismaClient, type PostTag, type Prisma } from "@prisma/client";

import { PARTNERS } from "../src/data/partners";
import { calculateSkillArbitrage } from "../src/lib/engines/skill-arbitrage";
import { calculateRemotePayEquity } from "../src/lib/engines/remote-pay-equity";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function hotScore(upvotes: number, downvotes: number, createdAt: Date): number {
  const score = upvotes - downvotes;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  return Number((sign * order + (createdAt.getTime() / 1000 - 1_700_000_000) / 45_000).toFixed(7));
}

const USERS = [
  {
    handle: "throwaway_dev",
    email: "throwaway_dev@example.com",
    currentRole: "Senior Backend",
    yearsExperience: 5,
    city: "Berlin",
    countryCode: "DE",
    currencyCode: "EUR",
    verification: "VERIFIED" as const,
    postKarma: 412,
    commentKarma: 1_180,
  },
  {
    handle: "lisbon_contractor",
    email: "lisbon_contractor@example.com",
    currentRole: "Full-Stack Engineer",
    yearsExperience: 7,
    city: "Lisbon",
    countryCode: "PT",
    currencyCode: "EUR",
    verification: "VERIFIED" as const,
    postKarma: 780,
    commentKarma: 2_050,
  },
  {
    handle: "dbt_convert",
    email: "dbt_convert@example.com",
    currentRole: "Analytics Engineer",
    yearsExperience: 4,
    city: "Warsaw",
    countryCode: "PL",
    currencyCode: "PLN",
    verification: "VERIFIED" as const,
    postKarma: 265,
    commentKarma: 640,
  },
  {
    handle: "eng_manager_anon",
    email: "eng_manager_anon@example.com",
    currentRole: "Engineering Manager",
    yearsExperience: 11,
    city: "Toronto",
    countryCode: "CA",
    currencyCode: "CAD",
    verification: "VERIFIED" as const,
    postKarma: 1_540,
    commentKarma: 3_900,
  },
  {
    handle: "grinding_leetcode",
    email: "grinding_leetcode@example.com",
    currentRole: "Frontend Engineer",
    yearsExperience: 2,
    city: "Bengaluru",
    countryCode: "IN",
    currencyCode: "INR",
    verification: "UNVERIFIED" as const,
    postKarma: 88,
    commentKarma: 210,
  },
  {
    handle: "pm_in_transit",
    email: "pm_in_transit@example.com",
    currentRole: "Product Manager",
    yearsExperience: 6,
    city: "Amsterdam",
    countryCode: "NL",
    currencyCode: "EUR",
    verification: "PENDING" as const,
    postKarma: 190,
    commentKarma: 470,
  },
];

interface SeedComment {
  author: string;
  content: string;
  anonymous?: boolean;
  up: number;
  down?: number;
  replies?: SeedComment[];
}

interface SeedPost {
  slug: string;
  title: string;
  content: string;
  tags: PostTag[];
  author: string;
  anonymous?: boolean;
  up: number;
  down?: number;
  ageDays: number;
  embed?: "arbitrage" | "equity";
  comments: SeedComment[];
}

const POSTS: SeedPost[] = [
  {
    slug: "95k-sf-contract-living-in-lisbon-worth-it",
    title: "$95k contract from a SF company while I live in Lisbon — is this actually good?",
    tags: ["OFFER_REVIEW", "REMOTE_WORK_LIFE"],
    author: "lisbon_contractor",
    up: 342,
    down: 11,
    ageDays: 2,
    embed: "equity",
    content: `Seven years full-stack, currently on €62k at a Portuguese company. A Series B in SF offered $95k as a B2B contractor, no equity, no benefits.

On paper it's a 40% raise. Then I ran it here and the picture changed:

- Social contributions as an independent are ~21% and I pay all of it
- No health cover, no pension match, no paid leave
- Getting dollars into euros costs me another 1.4% through my bank

The calculator says the net effective value lands around what a €78k local employment contract would give me, not €90k. That gap is basically the benefits I'd be self-funding.

What I can't work out: do I push on the rate, or push on the structure? Asking for an EOR arrangement feels like it might kill the whole thing at a company this size.`,
    comments: [
      {
        author: "throwaway_dev",
        up: 128,
        content: `Push on structure first, rate second. Here's why: if they move you to an EOR you get the benefits back and the rate becomes comparable to an employment contract. If they refuse, you now have a documented reason to ask for 15-20% more, because you're carrying costs they'd otherwise pay.

Also — $95k for a SF Series B on a senior full-stack contract is low even before the Lisbon adjustment. Their local hire would be $160k+. You're doing arbitrage for them, not with them.`,
        replies: [
          {
            author: "lisbon_contractor",
            up: 41,
            content: `That framing helps. I hadn't thought of the refusal as ammunition for the rate conversation.

Do you know roughly what an EOR costs them per head? Trying to work out if I'm asking for something trivial or something that blows their budget.`,
            replies: [
              {
                author: "eng_manager_anon",
                up: 96,
                content: `I've budgeted for these. EOR runs roughly $500-700/month per person on top of gross, plus the statutory employer costs for the country. For Portugal you're looking at maybe 25% loaded on top of your salary.

From the company side that's real but not blocking. What actually blocks it is nobody at a Series B wanting to open a new country entity relationship for one person. If they already have anyone else in the EU on an EOR, your ask is close to free. Worth finding out before you ask.`,
                replies: [
                  {
                    author: "lisbon_contractor",
                    up: 22,
                    content: `They mentioned two engineers in Poland during the interview. That's probably my answer — I'll ask how those are structured.`,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        author: "dbt_convert",
        up: 54,
        anonymous: true,
        content: `Went through nearly this exact thing in Warsaw last year, $88k B2B from a NY company.

One thing nobody told me: the FX spread is negotiable if you ask them to pay in EUR instead of USD. They were sending through a payment processor that took the hit anyway. Cost me nothing to ask and saved about €1,100/year.

Also open a multi-currency account before you sign, not after. I lost most of a month's difference to my regular bank before I moved.`,
      },
      {
        author: "grinding_leetcode",
        up: 8,
        down: 3,
        content: `Genuine question, not trying to be dismissive — at what point does the "they're doing arbitrage on you" argument stop? A company in SF can hire anywhere. If everyone in Lisbon holds out for SF rates, don't the roles just go to people who don't?`,
        replies: [
          {
            author: "throwaway_dev",
            up: 67,
            content: `It stops at the point where you have a competing offer, which is the only real leverage in any of this.

The reason to argue it isn't fairness, it's that remote comp bands are still being set right now and they're sticky. What the market accepts in 2026 is roughly what it pays in 2030. Individually you take the best offer in front of you. Collectively, the number of people who counter determines where the band lands.`,
          },
        ],
      },
    ],
  },
  {
    slug: "dropped-tableau-learned-dbt-outcome",
    title: "Stopped adding BI tools, learned dbt instead — six month outcome",
    tags: ["SKILL_ROADMAP", "SALARY_TRANSPARENCY"],
    author: "dbt_convert",
    up: 289,
    down: 6,
    ageDays: 5,
    embed: "arbitrage",
    content: `Data analyst in Warsaw, four years in. I was about to start a Tableau certification because every job ad mentioned it. Ran the numbers here first and it came back near the bottom of the list — high demand, but two thirds of analysts already have it, so it's not a differentiator, it's a checkbox.

dbt came back near the top: much thinner supply, and I already had the SQL prerequisite so the runway was shorter than the published estimate.

Six months later, 35 hours of actual study spread over evenings, one real project migrating our reporting layer:

- Old: 14,000 PLN/month
- New offer at a different company: 19,500 PLN/month, analytics engineer title

That's a bigger jump than the model predicted, though some of that is the title change rather than the skill alone. The honest version is that dbt got me interviews for a job category I couldn't previously apply to.

Happy to answer questions about the transition.`,
    comments: [
      {
        author: "pm_in_transit",
        up: 44,
        content: `The "checkbox vs differentiator" distinction is the useful bit here and I don't think most people separate them.

Follow-up question: how did you get a real project? That's the part that always stalls me — learning the tool is fine, having something to point at is the hard bit.`,
        replies: [
          {
            author: "dbt_convert",
            up: 71,
            content: `I rebuilt an existing reporting pipeline that already worked. That's the trick — I didn't ask permission for a new project, I offered to make a fragile thing less fragile.

Concretely: we had a stack of SQL views nobody could safely change. I modelled them in dbt with tests, ran both in parallel for three weeks, showed the tests catching two silent data bugs the old version had been shipping. After that it wasn't a proposal, it was already working.

If you can't do it at work, the second-best version is taking a public dataset and modelling it properly with tests and documentation. Weaker signal, but not nothing.`,
          },
        ],
      },
      {
        author: "throwaway_dev",
        up: 30,
        content: `Worth flagging for anyone reading: the jump here is title plus skill, and the title is doing a lot of the work. Analytics engineer bands are simply higher than analyst bands at most companies.

Doesn't undercut the post — that's exactly the point of picking a skill that opens a category. Just don't expect the same delta if you learn dbt and stay an analyst at the same employer.`,
      },
    ],
  },
  {
    slug: "graphql-lift-real-or-noise",
    title: "Is the GraphQL salary lift real or is it just selection bias?",
    tags: ["SKILL_ROADMAP"],
    author: "grinding_leetcode",
    anonymous: true,
    up: 156,
    down: 22,
    ageDays: 1,
    content: `Every calculator including this one puts GraphQL high on the list for frontend roles. Roughly 45 hours, double-digit percentage lift.

My suspicion: companies that use GraphQL are disproportionately well-funded product companies who'd pay more regardless of stack. The skill isn't causing the salary, the company type is causing both.

Has anyone actually seen a raise from adding GraphQL at their existing employer, as opposed to moving to a company that already used it?`,
    comments: [
      {
        author: "eng_manager_anon",
        up: 112,
        content: `Your suspicion is largely correct and it's worth being precise about what these models can and can't tell you.

Observational comp data shows association. Controlling for years of experience, as this one does, removes some confounding but not company type, funding stage, or the fact that people who learn a newer API layer voluntarily are already the people who get promoted.

What I'd say from the hiring side: I have never given someone a raise for learning GraphQL. I have shortlisted candidates because of it, repeatedly, when the alternative CVs were identical otherwise. The mechanism is access to a different interview pool, not a line item on a review.

That still makes it worth 45 hours. It just means the lift arrives when you change jobs, not when you finish the course.`,
        replies: [
          {
            author: "grinding_leetcode",
            up: 28,
            content: `This is a much more useful answer than I expected. "Access to a different pool" is the framing I was missing.`,
          },
          {
            author: "lisbon_contractor",
            up: 19,
            content: `Matches my experience. Nothing changed until I interviewed, then it changed a lot.`,
          },
        ],
      },
    ],
  },
  {
    slug: "berlin-vs-amsterdam-same-offer",
    title: "Same €95k offer, Berlin vs Amsterdam — the tax difference is brutal",
    tags: ["SALARY_TRANSPARENCY", "REMOTE_WORK_LIFE"],
    author: "throwaway_dev",
    up: 198,
    down: 4,
    ageDays: 8,
    content: `Company gave me the choice of which entity to join. Same gross, same role, same equity.

Ran both through the pay equity tool and the effective rates are far enough apart that the "same offer" framing is doing a lot of hiding. Berlin's blended effective rate came out around 38.5%, Amsterdam around 37.2% — closer than I expected, but rent is where it actually separates. Amsterdam rent is roughly 35% higher for an equivalent flat.

Ended up staying in Berlin. Posting the comparison in case anyone's weighing the same thing — happy to share the itemised version.`,
    comments: [
      {
        author: "pm_in_transit",
        up: 47,
        content: `Amsterdam has the 30% ruling if you're an incoming skilled migrant, which changes this comparison enormously — it's roughly five years of a large chunk of income being tax-free. Did that apply to you?

If you were already resident in the EU it may not have, which would explain why the numbers came out so close.`,
        replies: [
          {
            author: "throwaway_dev",
            up: 38,
            content: `Already resident, so no. Good catch and worth flagging — for someone moving in from outside, the Amsterdam side of this looks completely different.

This is the general problem with these comparisons: the blended rate is a planning number, and individual reliefs can swamp it.`,
          },
        ],
      },
    ],
  },
  {
    slug: "interview-loop-platform-role-breakdown",
    title: "Full interview loop breakdown: platform engineer, mid-size EU company",
    tags: ["INTERVIEW_EXPERIENCE"],
    author: "eng_manager_anon",
    up: 421,
    down: 9,
    ageDays: 12,
    content: `Writing this from the other side — I ran this loop for eighteen months. Sharing the structure and what actually moved decisions, since candidates consistently prepare for the wrong parts.

**Screen (30 min, recruiter).** Filters on salary expectation and notice period only. Give a range, not a number, and make the bottom of your range your actual target.

**Technical screen (60 min).** A debugging exercise on a broken Kubernetes deployment. No algorithms. About half of candidates failed this because they'd prepared for LeetCode.

**System design (75 min).** The differentiator. What separated strong from average wasn't the design, it was whether people asked what the failure budget was before proposing anything.

**Manager conversation (45 min).** Nominally culture fit. Actually: can you describe a technical decision you got wrong, specifically, without either minimising it or performing contrition.

The offer stage was where most negotiating leverage sat and almost nobody used it. Of the candidates we hired, two negotiated. Both got what they asked for.`,
    comments: [
      {
        author: "dbt_convert",
        up: 88,
        content: `"Both got what they asked for" is the line that should be at the top of this post.`,
      },
      {
        author: "grinding_leetcode",
        up: 52,
        content: `The debugging screen instead of algorithms is a relief to read but also — how do you prepare for that? LeetCode is at least a legible thing to grind.

Is it just "have operated a real cluster" or is there something to study?`,
        replies: [
          {
            author: "eng_manager_anon",
            up: 74,
            content: `Mostly the former, but not entirely. What we were watching for was method, not knowledge: do you read the logs before changing anything, do you form a hypothesis and test it, do you say out loud what you expect to see.

Candidates who'd only read about Kubernetes still passed sometimes, because they debugged systematically. Candidates who'd run clusters for years sometimes failed because they started changing things immediately.

If you want practice, break your own cluster deliberately and fix it. Delete a secret, misconfigure a readiness probe, exhaust a resource quota. The specific failures matter less than getting used to working from symptom to cause under time pressure.`,
          },
        ],
      },
    ],
  },
];

async function main() {
  console.log("Clearing existing data…");
  await prisma.partnerClick.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.calculationHistory.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding users…");
  const userByHandle = new Map<string, string>();
  for (const u of USERS) {
    const created = await prisma.user.create({
      data: {
        ...u,
        headline: `${u.currentRole} · ${u.city}`,
        verifiedAt: u.verification === "VERIFIED" ? daysAgo(120) : null,
      },
      select: { id: true, handle: true },
    });
    userByHandle.set(created.handle, created.id);
  }

  console.log("Seeding partners…");
  for (const p of PARTNERS) {
    await prisma.partner.create({
      data: {
        slug: p.slug,
        name: p.name,
        category: p.category,
        blurb: p.blurb,
        ctaLabel: p.ctaLabel,
        url: p.url,
        skillSlugs: p.skillSlugs,
        countryCodes: p.countryCodes,
        priority: p.priority,
        payoutModel: p.category === "course" ? "RevShare" : "CPA",
      },
    });
  }

  console.log("Seeding calculation snapshots…");
  const arbitrageInput = {
    currentRoleId: "data-analyst",
    currentSkillIds: ["sql", "python", "tableau"],
    targetRoleId: "analytics-engineer",
    marketId: "warsaw",
    currencyCode: "PLN",
    yearsExperience: 4,
    weeklyStudyHours: 6,
  } as const;
  const arbitrageResult = calculateSkillArbitrage({
  ...arbitrageInput,
  currentSkillIds: [...arbitrageInput.currentSkillIds],
});

  const equityInput = {
    baseOffer: 95_000,
    offerCurrency: "USD",
    anchorMarketId: "san-francisco",
    livingMarketId: "lisbon",
    employment: "CONTRACTOR",
    variableComp: 0,
    roleId: "fullstack-engineer",
  } as const;
  const equityResult = calculateRemotePayEquity({ ...equityInput });

  const arbitrageSnapshot = await prisma.calculationHistory.create({
    data: {
      type: "SKILL_ARBITRAGE",
      input: arbitrageInput as unknown as Prisma.InputJsonValue,
      result: arbitrageResult as unknown as Prisma.InputJsonValue,
      engineVersion: arbitrageResult.engineVersion,
      headlineValue: Number(arbitrageResult.stackedLift.salaryLift.toFixed(2)),
      currencyCode: "PLN",
      countryCode: "PL",
      userId: userByHandle.get("dbt_convert"),
      isShared: true,
    },
    select: { id: true },
  });

  const equitySnapshot = await prisma.calculationHistory.create({
    data: {
      type: "REMOTE_PAY_EQUITY",
      input: equityInput as unknown as Prisma.InputJsonValue,
      result: equityResult as unknown as Prisma.InputJsonValue,
      engineVersion: equityResult.engineVersion,
      headlineValue: Number(equityResult.netEffectiveValue.toFixed(2)),
      currencyCode: "EUR",
      countryCode: "PT",
      employment: "CONTRACTOR",
      userId: userByHandle.get("lisbon_contractor"),
      isShared: true,
    },
    select: { id: true },
  });

  console.log("Seeding posts and comments…");
  for (const seed of POSTS) {
    const authorId = userByHandle.get(seed.author);
    if (!authorId) continue;
    const author = USERS.find((u) => u.handle === seed.author);
    const createdAt = daysAgo(seed.ageDays);
    const down = seed.down ?? 0;

    const totalComments = countComments(seed.comments);

    const post = await prisma.post.create({
      data: {
        slug: seed.slug,
        title: seed.title,
        content: seed.content,
        tags: seed.tags,
        isAnonymous: seed.anonymous ?? false,
        authorBadge:
          seed.anonymous || !author
            ? null
            : `${author.currentRole} | ${author.yearsExperience} YOE`,
        authorId,
        upvotes: seed.up,
        downvotes: down,
        commentCount: totalComments,
        viewCount: seed.up * 14,
        hotScore: hotScore(seed.up, down, createdAt),
        createdAt,
        embeddedCalculationId:
          seed.embed === "arbitrage"
            ? arbitrageSnapshot.id
            : seed.embed === "equity"
              ? equitySnapshot.id
              : null,
      },
      select: { id: true },
    });

    await seedComments(post.id, seed.comments, null, "", 0, userByHandle, createdAt);
  }

  console.log("Done.");
}

function countComments(comments: SeedComment[]): number {
  return comments.reduce((total, c) => total + 1 + countComments(c.replies ?? []), 0);
}

async function seedComments(
  postId: string,
  comments: SeedComment[],
  parentId: string | null,
  parentPath: string,
  depth: number,
  userByHandle: Map<string, string>,
  postCreatedAt: Date,
): Promise<void> {
  let index = 0;
  for (const c of comments) {
    index += 1;
    const authorId = userByHandle.get(c.author);
    if (!authorId) continue;
    const author = USERS.find((u) => u.handle === c.author);
    const segment = String(index).padStart(4, "0");
    const path = parentPath ? `${parentPath}.${segment}` : segment;

    const created = await prisma.comment.create({
      data: {
        postId,
        parentId,
        path,
        depth,
        content: c.content,
        isAnonymous: c.anonymous ?? false,
        authorBadge:
          c.anonymous || !author
            ? null
            : `${author.currentRole} | ${author.yearsExperience} YOE`,
        authorId,
        upvotes: c.up,
        downvotes: c.down ?? 0,
        createdAt: new Date(postCreatedAt.getTime() + (depth + 1) * 3 * 60 * 60 * 1000),
      },
      select: { id: true },
    });

    if (c.replies?.length) {
      await seedComments(
        postId,
        c.replies,
        created.id,
        path,
        depth + 1,
        userByHandle,
        postCreatedAt,
      );
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
