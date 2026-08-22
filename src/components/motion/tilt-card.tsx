"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * 3D perspective tilt that follows the pointer.
 *
 * Written against the DOM directly rather than through an animation library:
 * the transform is applied in a rAF callback with no React state, so a mouse
 * move never triggers a render. That is both smoother than a state-driven
 * spring and one less dependency to keep current.
 *
 * Disabled under reduced-motion and on touch, where there is no hover to
 * respond to and the tilt would only fire on tap.
 */
export function TiltCard({
  children,
  className,
  max = 7,
}: {
  children: React.ReactNode;
  className?: string;
  /** Maximum rotation in degrees on either axis. */
  max?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const frame = React.useRef(0);
  const target = React.useRef({ rx: 0, ry: 0, gx: 50, gy: 50 });

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduced || !fine) return;

    let current = { rx: 0, ry: 0, gx: 50, gy: 50 };

    function onMove(e: MouseEvent) {
      const rect = node!.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      target.current = {
        ry: (px - 0.5) * 2 * max,
        rx: -(py - 0.5) * 2 * max,
        gx: px * 100,
        gy: py * 100,
      };
    }

    function onLeave() {
      target.current = { rx: 0, ry: 0, gx: 50, gy: 50 };
    }

    function tick() {
      frame.current = requestAnimationFrame(tick);

      // Ease toward the target so the card settles rather than snapping.
      current = {
        rx: current.rx + (target.current.rx - current.rx) * 0.12,
        ry: current.ry + (target.current.ry - current.ry) * 0.12,
        gx: current.gx + (target.current.gx - current.gx) * 0.12,
        gy: current.gy + (target.current.gy - current.gy) * 0.12,
      };

      node!.style.transform = `perspective(900px) rotateX(${current.rx.toFixed(2)}deg) rotateY(${current.ry.toFixed(2)}deg)`;
      node!.style.setProperty("--gx", `${current.gx.toFixed(1)}%`);
      node!.style.setProperty("--gy", `${current.gy.toFixed(1)}%`);
    }

    node.addEventListener("mousemove", onMove);
    node.addEventListener("mouseleave", onLeave);
    frame.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame.current);
      node.removeEventListener("mousemove", onMove);
      node.removeEventListener("mouseleave", onLeave);
    };
  }, [max]);

  return (
    <div ref={ref} className={cn("tilt will-change-transform", className)}>
      {children}
    </div>
  );
}
