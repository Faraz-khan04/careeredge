"use client";

import * as React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const NAV = [
  { href: "/tools/skill-arbitrage", label: "Skill ROI" },
  { href: "/tools/remote-pay-equity", label: "COLA pay" },
  { href: "/tools/ctc-calculator", label: "CTC calculator" },
  { href: "/tools/jd-simplifier", label: "JD simplifier" },
  { href: "/tools/application-tracker", label: "Tracker" },
  { href: "/community", label: "Community" },
];

export function SiteHeader({ userMenu }: { userMenu?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-baseline gap-2.5">
          <span className="text-base font-semibold tracking-tight">CareerEdge</span>
          <span className="hidden font-mono text-xs tracking-wider text-muted-foreground xl:inline">
            what the market actually pays
          </span>
        </Link>

        {/* Below lg the nav scrolls horizontally rather than wrapping or
            being hidden behind a menu — five short labels fit a swipe. */}
        <nav className="-mx-2 flex flex-1 items-center gap-1 overflow-x-auto px-2 lg:flex-none lg:overflow-visible">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-secondary/70 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                )}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute inset-x-3 -bottom-[13px] h-px bg-primary shadow-[0_0_8px_1px_hsl(var(--primary)/0.6)]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {userMenu}
          <Button size="sm" className="shadow-lg shadow-primary/20" asChild>
            <Link href="/community/new">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Post a salary</span>
              <span className="sm:hidden">Post</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
