"use client";

import { ArrowUpRight } from "lucide-react";
import { withAffiliateTag, type PartnerOffer } from "@/data/partners";
import { cn } from "@/lib/utils";

interface PartnerCardProps {
  offer: PartnerOffer;
  /** Where the card is rendered — recorded against the click for attribution. */
  placement: string;
  className?: string;
}

export function PartnerCard({ offer, placement, className }: PartnerCardProps) {
  function handleClick() {
    // Fire-and-forget: an attribution beacon must never delay the navigation.
    void fetch("/api/partner-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: offer.slug, placement }),
      keepalive: true,
    }).catch(() => undefined);
  }

  return (
    <a
      href={withAffiliateTag(offer.url)}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={handleClick}
      className={cn(
        "group flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{offer.name}</span>
          <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            {offer.disclosure}
          </span>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{offer.blurb}</p>

      <span className="mt-1 text-sm font-medium text-primary">{offer.ctaLabel}</span>
    </a>
  );
}

export function PartnerRail({
  offers,
  placement,
  heading,
}: {
  offers: PartnerOffer[];
  placement: string;
  heading: string;
}) {
  if (offers.length === 0) return null;
  return (
    <section className="space-y-3">
      <h3 className="eyebrow">{heading}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {offers.map((offer) => (
          <PartnerCard key={offer.slug} offer={offer} placement={placement} />
        ))}
      </div>
    </section>
  );
}
