import Link from "next/link";
import { cn } from "@/lib/utils";

export const TAG_LABEL = {
  OFFER_REVIEW: "#OfferReview",
  SALARY_TRANSPARENCY: "#SalaryTransparency",
  INTERVIEW_EXPERIENCE: "#InterviewExperience",
  SKILL_ROADMAP: "#SkillRoadmap",
  REMOTE_WORK_LIFE: "#RemoteWorkLife",
} as const;

export type TagKey = keyof typeof TAG_LABEL;

export function TagPill({
  tag,
  active = false,
  asLink = true,
}: {
  tag: TagKey;
  active?: boolean;
  asLink?: boolean;
}) {
  const className = cn(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
    active
      ? "border-primary/40 bg-primary/12 text-primary"
      : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
  );

  if (!asLink) return <span className={className}>{TAG_LABEL[tag]}</span>;

  return (
    <Link href={`/community?tag=${tag}`} className={className}>
      {TAG_LABEL[tag]}
    </Link>
  );
}
