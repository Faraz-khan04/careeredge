import { Heart } from "lucide-react";

/**
 * Renders nothing unless a donation URL is configured, so the site never
 * shows a dead link. Point it at a Razorpay payment page — UPI matters far
 * more than cards for an Indian audience.
 */
export function DonateLink() {
  const url = process.env.NEXT_PUBLIC_DONATE_URL;
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      <Heart className="h-3.5 w-3.5 text-[hsl(var(--drop))]" aria-hidden="true" />
      Support this project
    </a>
  );
}
