import Link from "next/link";

import { DonateLink } from "@/components/layout/donate-link";

const LINKS = [
  { href: "/tools/skill-arbitrage", label: "Skill ROI" },
  { href: "/tools/remote-pay-equity", label: "Cost-of-living adjusted pay" },
  { href: "/tools/ctc-calculator", label: "CTC to in-hand" },
  { href: "/tools/jd-simplifier", label: "Job description simplifier" },
  { href: "/tools/application-tracker", label: "Application tracker" },
  { href: "/community", label: "Community" },
  { href: "/methodology", label: "Methodology" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/[0.06]">
      <div className="container flex flex-col gap-10 py-12 sm:flex-row sm:justify-between">
        <div className="max-w-sm">
          <p className="font-semibold tracking-tight">CareerEdge</p>
          <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground">
            what the market actually pays
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Compensation figures are modelled medians, not offers. Tax lines are planning
            estimates. Check anything material with a professional in your jurisdiction.
          </p>
          <Link
            href="/methodology"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            How these numbers are produced &rarr;
          </Link>

          <div className="mt-5">
            <DonateLink />
          </div>
        </div>

        <nav aria-label="Footer">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground">
            Product
          </p>
          <ul className="mt-3 space-y-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/[0.06]">
        <p className="container py-5 font-mono text-xs text-muted-foreground">
          Some outbound links are paid placements and are labelled where they appear.
        </p>
      </div>
    </footer>
  );
}
