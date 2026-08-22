import { ROLES } from "@/data/roles";
import { SKILLS } from "@/data/skills";
import { MARKETS } from "@/data/markets";
import {
  GREEN_FLAGS,
  RED_FLAGS,
  SKILL_ALIASES,
  type JdSignal,
} from "@/data/jd-signals";
import type { Skill } from "@/types";

export const JD_PARSER_VERSION = "1.0.0";

export interface MatchedSignal extends JdSignal {
  /** The literal text from the posting that matched, for highlighting back. */
  excerpt: string;
  /** Character offset of the match in the original text. */
  start: number;
  /** Character offset one past the end of the match. */
  end: number;
  /** The matched substring exactly as written. */
  matchedText: string;
}

export interface JdAnalysis {
  wordCount: number;
  readingMinutes: number;

  /** Best guess at the role, matched against the role dataset. */
  role: { id: string; name: string } | null;
  /** Best guess at the market, for handing off to pay equity. */
  marketId: string | null;

  statedSalary: { min: number; max: number | null; currency: string } | null;
  yearsRequired: number | null;
  seniority: "entry" | "mid" | "senior" | null;

  /** Skills in the posting that exist in the dataset. */
  matchedSkills: Skill[];
  /** Capitalised tokens that look like tools but aren't in the dataset. */
  unrecognisedSkills: string[];

  redFlags: MatchedSignal[];
  greenFlags: MatchedSignal[];

  /**
   * Derived observations that aren't phrase matches — things you can only see
   * by counting.
   */
  observations: { label: string; detail: string; severity: "high" | "medium" | "low" }[];

  /** Questions worth putting to the employer, gathered from the flags. */
  questions: string[];

  /** 0–100. How much this posting actually tells you. */
  clarityScore: number;
  verdict: string;
  engineVersion: string;
}

const WORD = /[\p{L}\p{N}#+.]+/gu;

function findSignals(text: string, dictionary: readonly JdSignal[]): MatchedSignal[] {
  const found: MatchedSignal[] = [];

  for (const signal of dictionary) {
    const re = new RegExp(signal.pattern, "i");
    const m = re.exec(text);
    if (!m) continue;

    // Keep a little context either side so the reader can see it in place.
    const start = Math.max(0, m.index - 40);
    const end = Math.min(text.length, m.index + m[0].length + 40);
    const excerpt =
      (start > 0 ? "…" : "") + text.slice(start, end).replace(/\s+/g, " ").trim() + (end < text.length ? "…" : "");

    found.push({
      ...signal,
      excerpt,
      start: m.index,
      end: m.index + m[0].length,
      matchedText: m[0],
    });
  }

  const weight = { high: 0, medium: 1, low: 2 } as const;
  return found.sort((a, b) => weight[a.severity] - weight[b.severity]);
}

function detectRole(text: string): { id: string; name: string } | null {
  const lower = text.toLowerCase();
  let best: { id: string; name: string; score: number } | null = null;

  for (const role of ROLES) {
    const name = role.name.toLowerCase();
    if (!lower.includes(name)) continue;

    // Longer names are more specific: "analytics engineer" beats "engineer".
    const score = name.length;
    if (!best || score > best.score) best = { id: role.id, name: role.name, score };
  }

  return best ? { id: best.id, name: best.name } : null;
}

function detectMarket(text: string): string | null {
  const lower = text.toLowerCase();
  for (const m of MARKETS) {
    if (lower.includes(m.city.toLowerCase())) return m.id;
  }
  return null;
}

function detectSkills(text: string): { matched: Skill[]; unrecognised: string[] } {
  const lower = text.toLowerCase();
  const tokens = new Set(lower.match(WORD) ?? []);

  const matched: Skill[] = [];
  for (const skill of SKILLS) {
    const name = skill.name.toLowerCase();
    const hit =
      tokens.has(name) ||
      tokens.has(skill.id) ||
      lower.includes(name) ||
      Object.entries(SKILL_ALIASES).some(([alias, id]) => id === skill.id && tokens.has(alias));

    if (hit) matched.push(skill);
  }

  const known = new Set(matched.flatMap((s) => [s.name.toLowerCase(), s.id]));

  // Tokens that look like product names — capitalised mid-sentence, or
  // containing a dot or plus — which we don't have data for.
  const unrecognised = Array.from(
    new Set(
      (text.match(/\b[A-Z][A-Za-z0-9.+#]{2,}\b/g) ?? [])
        .map((t) => t.trim())
        .filter((t) => !known.has(t.toLowerCase()))
        .filter((t) => !COMMON_WORDS.has(t.toLowerCase())),
    ),
  ).slice(0, 12);

  return { matched, unrecognised };
}

const COMMON_WORDS = new Set([
  "the","this","that","you","your","we","our","they","their","and","for","with","about","who","what",
  "will","must","should","have","has","been","are","was","were","from","into","over","under","team",
  "role","job","work","working","experience","years","year","company","business","product","customer",
  "customers","candidate","candidates","apply","applications","position","opportunity","responsibilities",
  "requirements","qualifications","preferred","required","skills","ability","strong","excellent","good",
  "great","new","other","more","most","all","any","each","every","some","please","note","benefits",
  "salary","location","remote","hybrid","onsite","office","full","time","part","monday","friday",
]);

function detectSalary(text: string): JdAnalysis["statedSalary"] {
  // ₹12,00,000 – ₹18,00,000 / $120k-$150k / €80,000 to €95,000 / 15-20 LPA
  const symbolRange =
    /([₹$€£])\s?([\d,.]+)\s?(k|l|lpa|lakh|lakhs|m)?\s*(?:-|–|to|—)\s*([₹$€£])?\s?([\d,.]+)\s?(k|l|lpa|lakh|lakhs|m)?/i;
  const lpaRange = /([\d.]+)\s*(?:-|–|to)\s*([\d.]+)\s*(?:lpa|lakhs?|l\b)/i;
  const single = /([₹$€£])\s?([\d,.]+)\s?(k|l|lpa|lakh|lakhs|m)?\b/i;

  const scale = (raw: string, suffix?: string): number => {
    const n = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(n)) return NaN;
    const s = (suffix ?? "").toLowerCase();
    if (s === "k") return n * 1_000;
    if (s === "m") return n * 1_000_000;
    if (s === "l" || s === "lpa" || s === "lakh" || s === "lakhs") return n * 100_000;
    return n;
  };

  const currencyOf = (sym?: string): string =>
    sym === "₹" ? "INR" : sym === "€" ? "EUR" : sym === "£" ? "GBP" : "USD";

  const r = symbolRange.exec(text);
  if (r?.[2] && r[5]) {
    const min = scale(r[2], r[3]);
    const max = scale(r[5], r[6] ?? r[3]);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return { min, max, currency: currencyOf(r[1]) };
    }
  }

  const l = lpaRange.exec(text);
  if (l?.[1] && l[2]) {
    return { min: Number(l[1]) * 100_000, max: Number(l[2]) * 100_000, currency: "INR" };
  }

  const s = single.exec(text);
  if (s?.[2]) {
    const min = scale(s[2], s[3]);
    // Ignore small numbers — they're usually years or team sizes, not pay.
    if (Number.isFinite(min) && min >= 10_000) {
      return { min, max: null, currency: currencyOf(s[1]) };
    }
  }

  return null;
}

function detectYears(text: string): number | null {
  const matches = [...text.matchAll(/(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:years?|yrs?)\b/gi)];
  const years = matches
    .map((m) => Number(m[1]))
    .filter((n) => Number.isFinite(n) && n > 0 && n < 40);
  return years.length ? Math.max(...years) : null;
}

function detectSeniority(text: string): JdAnalysis["seniority"] {
  const lower = text.toLowerCase();
  if (/\b(?:senior|staff|principal|lead|head of|director)\b/.test(lower)) return "senior";
  if (/\b(?:junior|entry[- ]level|graduate|fresher|intern|trainee|associate)\b/.test(lower)) return "entry";
  if (/\b(?:mid[- ]level|intermediate)\b/.test(lower)) return "mid";
  return null;
}

/**
 * Parses a pasted job description.
 *
 * Deterministic by design: every flag corresponds to text that is literally
 * present, so the tool can always show its work. Nothing is inferred, ranked
 * by a model, or invented.
 */
export function analyseJobDescription(raw: string): JdAnalysis {
  const text = raw.replace(/\r/g, "").trim();
  const words = text.match(WORD) ?? [];
  const wordCount = words.length;

  const { matched, unrecognised } = detectSkills(text);
  const redFlags = findSignals(text, RED_FLAGS);
  const greenFlags = findSignals(text, GREEN_FLAGS);
  const statedSalary = detectSalary(text);
  const yearsRequired = detectYears(text);
  const seniority = detectSeniority(text);

  // ---------------------------------------------------------------- counted
  const observations: JdAnalysis["observations"] = [];

  if (!statedSalary) {
    observations.push({
      label: "No pay figure anywhere",
      detail:
        "Nothing in this posting commits to a number. You will be asked for your expectations first, which hands the anchor to them.",
      severity: "medium",
    });
  }

  if (matched.length + unrecognised.length >= 12) {
    observations.push({
      label: `${matched.length + unrecognised.length} distinct tools or skills listed`,
      detail:
        "Beyond about ten, a requirements list is usually a wish list assembled from several people rather than a description of one job. Most postings like this hire someone with half of it.",
      severity: "low",
    });
  }

  if (seniority === "entry" && (yearsRequired ?? 0) >= 3) {
    observations.push({
      label: `Junior title, ${yearsRequired} years demanded`,
      detail:
        "The level and the requirement contradict each other. In practice this is usually a mid-level job priced at a junior band.",
      severity: "high",
    });
  }

  if (wordCount > 900) {
    observations.push({
      label: "Very long posting",
      detail:
        "Past roughly 900 words, postings tend to be assembled by committee. Expect the interview loop to reflect the same lack of a single owner.",
      severity: "low",
    });
  }

  if (wordCount > 0 && wordCount < 120) {
    observations.push({
      label: "Unusually thin posting",
      detail:
        "There is not enough here to know what the job is. Ask for a real description before investing time in an application.",
      severity: "medium",
    });
  }

  // ----------------------------------------------------------------- score
  // Starts from what a posting tells you, then deducts for what it hides.
  let clarity = 55;
  if (statedSalary) clarity += 20;
  if (greenFlags.length) clarity += Math.min(15, greenFlags.length * 5);
  if (matched.length >= 3) clarity += 6;
  if (yearsRequired !== null) clarity += 4;

  for (const f of redFlags) {
    clarity -= f.severity === "high" ? 14 : f.severity === "medium" ? 7 : 3;
  }
  for (const o of observations) {
    clarity -= o.severity === "high" ? 12 : o.severity === "medium" ? 6 : 2;
  }

  const clarityScore = Math.max(0, Math.min(100, Math.round(clarity)));

  const highCount = redFlags.filter((f) => f.severity === "high").length;
  const verdict =
    highCount > 0
      ? "There are terms here that would cost you money or freedom. Get them in writing before going further."
      : clarityScore >= 75
        ? "This posting tells you what the job is and what it pays. Worth your time."
        : clarityScore >= 50
          ? "Reasonable, but it leaves out things you would want to know. The questions below are worth asking early."
          : "This posting withholds most of what matters. Treat the first call as fact-finding, not selling yourself.";

  // Deduplicated, in severity order — the flags are already sorted.
  const questions = Array.from(
    new Set(redFlags.map((f) => f.ask).filter((q): q is string => Boolean(q))),
  );

  return {
    wordCount,
    readingMinutes: Math.max(1, Math.round(wordCount / 220)),
    questions,
    role: detectRole(text),
    marketId: detectMarket(text),
    statedSalary,
    yearsRequired,
    seniority,
    matchedSkills: matched,
    unrecognisedSkills: unrecognised,
    redFlags,
    greenFlags,
    observations,
    clarityScore,
    verdict,
    engineVersion: JD_PARSER_VERSION,
  };
}
