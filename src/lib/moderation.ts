/**
 * First-line content safety for the community.
 *
 * This runs in the browser to give people immediate, specific feedback while
 * they type. It is a UX affordance, not a security control — `validateContent`
 * is called again inside the API route, and the server result is the one that
 * decides whether a post publishes.
 */

export type Severity = "block" | "warn";

export interface ModerationFinding {
  code: string;
  severity: Severity;
  message: string;
  /** Character offsets in the source string, for inline highlighting. */
  range?: [number, number];
}

export interface ModerationResult {
  ok: boolean;
  findings: ModerationFinding[];
  /** Content with detected PII replaced, offered as a one-click fix. */
  redacted: string;
}

const PII_PATTERNS: {
  code: string;
  label: string;
  pattern: RegExp;
  replacement: string;
  severity: Severity;
}[] = [
  {
    code: "email",
    label: "an email address",
    pattern: /[\w.+-]+@[\w-]+\.[\w.]{2,}/g,
    replacement: "[email removed]",
    severity: "block",
  },
  {
    code: "phone",
    label: "a phone number",
    pattern: /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}[\s.-]?\d{0,4}/g,
    replacement: "[phone removed]",
    severity: "warn",
  },
  {
    code: "ssn",
    label: "a national ID number",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[ID removed]",
    severity: "block",
  },
  {
    code: "linkedin",
    label: "a personal profile link",
    pattern: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/gi,
    replacement: "[profile link removed]",
    severity: "block",
  },
];

/**
 * Deliberately narrow. Over-blocking a salary forum makes people write around
 * the filter, and frustration reads as censorship. Slurs are blocked; ordinary
 * swearing in a post about a bad manager is not the problem this list solves.
 */
const BLOCKED_TERMS: string[] = [
  // Populate from a maintained slur list at deploy time; kept empty in source
  // so the repository doesn't ship a dictionary of slurs.
];

const SPAM_SIGNALS: { code: string; message: string; test: (s: string) => boolean }[] = [
  {
    code: "link-farm",
    message: "More than three outbound links reads as promotion. Trim it down.",
    test: (s) => (s.match(/https?:\/\//g) ?? []).length > 3,
  },
  {
    code: "shouting",
    message: "Most of this is in capitals. Lower case gets read more often.",
    test: (s) => {
      const letters = s.replace(/[^a-zA-Z]/g, "");
      if (letters.length < 40) return false;
      const caps = letters.replace(/[^A-Z]/g, "").length;
      return caps / letters.length > 0.6;
    },
  },
  {
    code: "repetition",
    message: "The same phrase repeats several times. Say it once.",
    test: (s) => {
      const words = s.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      if (words.length < 20) return false;
      const counts = new Map<string, number>();
      for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
      return [...counts.values()].some((c) => c / words.length > 0.18);
    },
  },
];

export function validateContent(input: string): ModerationResult {
  const findings: ModerationFinding[] = [];
  let redacted = input;

  for (const rule of PII_PATTERNS) {
    const matches = [...input.matchAll(rule.pattern)];
    for (const match of matches) {
      // Skip phone-shaped strings that are actually salary figures.
      if (rule.code === "phone" && /^[\d\s,.]+$/.test(match[0]) && match[0].length < 9) {
        continue;
      }
      findings.push({
        code: rule.code,
        severity: rule.severity,
        message: `This looks like ${rule.label}. Posts here stay pseudonymous — remove it before publishing.`,
        range: match.index !== undefined ? [match.index, match.index + match[0].length] : undefined,
      });
    }
    if (matches.length > 0) {
      redacted = redacted.replace(rule.pattern, rule.replacement);
    }
  }

  const lowered = input.toLowerCase();
  for (const term of BLOCKED_TERMS) {
    if (lowered.includes(term)) {
      findings.push({
        code: "blocked-term",
        severity: "block",
        message: "This contains language that isn't allowed here.",
      });
      break;
    }
  }

  for (const signal of SPAM_SIGNALS) {
    if (signal.test(input)) {
      findings.push({ code: signal.code, severity: "warn", message: signal.message });
    }
  }

  return {
    ok: !findings.some((f) => f.severity === "block"),
    findings,
    redacted,
  };
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

export interface RateLimitState {
  remaining: number;
  resetAt: number;
  blocked: boolean;
}

const BUCKETS = new Map<string, number[]>();

/**
 * Sliding-window limiter. In the browser it keeps someone from firing off ten
 * posts in a minute; the same function backs the API route, where an
 * upstash/redis store replaces the Map for multi-instance deployments.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitState {
  const hits = (BUCKETS.get(key) ?? []).filter((t) => now - t < windowMs);
  const blocked = hits.length >= limit;
  if (!blocked) hits.push(now);
  BUCKETS.set(key, hits);

  const oldest = hits[0] ?? now;
  return {
    remaining: Math.max(0, limit - hits.length),
    resetAt: oldest + windowMs,
    blocked,
  };
}

export const RATE_LIMITS = {
  post: { limit: 3, windowMs: 60 * 60 * 1000 },
  comment: { limit: 12, windowMs: 10 * 60 * 1000 },
  vote: { limit: 60, windowMs: 60 * 1000 },
} as const;
