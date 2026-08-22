import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Whole-currency formatting. Money in this product is never shown with cents. */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  opts: { compact?: boolean } = {},
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
    notation: opts.compact ? "compact" : "standard",
  }).format(amount);
}

export function formatPercent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function formatSigned(amount: number, currencyCode: string): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${sign}${formatCurrency(Math.abs(amount), currencyCode)}`;
}

export function formatHours(hours: number): string {
  if (hours < 60) return `${Math.round(hours)} hrs`;
  return `${Math.round(hours)} hrs`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 72);
}

export function relativeTime(date: Date | string): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, secondsInUnit] of units) {
    if (seconds >= secondsInUnit) {
      return rtf.format(-Math.floor(seconds / secondsInUnit), unit);
    }
  }
  return "just now";
}

/**
 * Reddit-style hot rank. Score dominates early, age erodes it on a log curve so
 * a 200-point post from last week doesn't sit above today's discussion.
 */
export function hotScore(upvotes: number, downvotes: number, createdAt: Date): number {
  const score = upvotes - downvotes;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const epochSeconds = createdAt.getTime() / 1000 - 1_700_000_000;
  return Number((sign * order + epochSeconds / 45_000).toFixed(7));
}

/** Wilson lower bound — used for the "Top" sort so low-volume posts aren't inflated. */
export function wilsonScore(upvotes: number, downvotes: number): number {
  const n = upvotes + downvotes;
  if (n === 0) return 0;
  const z = 1.281_551_565_545_2; // 80% confidence
  const p = upvotes / n;
  const left = p + (z * z) / (2 * n);
  const right = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return (left - right) / (1 + (z * z) / n);
}
