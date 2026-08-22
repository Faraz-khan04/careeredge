"use client";

import * as React from "react";

import { cn, formatCurrency } from "@/lib/utils";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Reveals children once they scroll into view.
 *
 * The element is never hidden by JavaScript — the `.reveal` class carries the
 * initial state and the observer only adds `.is-visible`. If the observer
 * fails to run for any reason, the reduced-motion rule in globals.css still
 * leaves the content readable rather than invisible.
 */
export function Reveal({
  children,
  className,
  delayMs = 0,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);

  // Widened deliberately. With a literal union, TypeScript intersects the ref
  // types of every element in it, and no single ref can satisfy div, li and
  // article at once.
  const Tag = as as React.ElementType;

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </Tag>
  );
}

/**
 * Counts a figure up when it enters view.
 *
 * Formatting is described with plain props rather than a callback, because a
 * server component can only pass serializable values across to the client —
 * a `format` function would fail at the boundary.
 *
 * Renders the final value on the server and as the initial client state, so
 * the real number is in the HTML for anyone without JavaScript and for search
 * engines; the animation only replays it.
 */
export function CountUp({
  value,
  currency,
  prefix = "",
  suffix = "",
  durationMs = 1100,
  className,
}: {
  value: number;
  /** ISO currency code. When present the figure renders as money. */
  currency?: string;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = React.useState(value);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();

        let frame = 0;
        const start = performance.now();

        const tick = (now: number) => {
          const t = Math.min((now - start) / durationMs, 1);
          // Ease-out cubic: fast arrival, soft landing.
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(value * eased);
          if (t < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value, durationMs]);

  const body = currency
    ? formatCurrency(display, currency)
    : Math.round(display).toLocaleString("en-US");

  return (
    <span ref={ref} className={className}>
      {prefix}
      {body}
      {suffix}
    </span>
  );
}
