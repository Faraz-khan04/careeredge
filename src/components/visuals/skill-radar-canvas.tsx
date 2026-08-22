"use client";

import * as React from "react";

import { formatCurrency, formatPercent } from "@/lib/utils";
import type { ArbitrageRecommendation } from "@/types";

/**
 * Interactive skill field.
 *
 * Nodes are NOT arbitrarily scattered: each orb sits at its real coordinates
 * — x is effective study hours, y is pay lift — and the physics displace it
 * around that true position. The field breathes, but it still reads as the
 * chart it is, and a node's location remains a claim about the data.
 */

interface Node {
  rec: ArbitrageRecommendation;
  /** Home position in canvas space. */
  hx: number;
  hy: number;
  /** Current position. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  colour: string;
  glow: boolean;
}

const QUADRANT_COLOUR: Record<ArbitrageRecommendation["quadrant"], string> = {
  "quick-win": "#10B981",
  strategic: "#06B6D4",
  incremental: "#8B93A7",
  "long-haul": "#F59E0B",
};

export function SkillRadarCanvas({
  recommendations,
  currencyCode,
}: {
  recommendations: ArbitrageRecommendation[];
  currencyCode: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const nodesRef = React.useRef<Node[]>([]);
  const pointerRef = React.useRef({ x: -9999, y: -9999, active: false });
  const ringsRef = React.useRef<{ x: number; y: number; t: number; colour: string }[]>([]);

  const [hovered, setHovered] = React.useState<{ rec: ArbitrageRecommendation; x: number; y: number } | null>(null);
  const [selected, setSelected] = React.useState<ArbitrageRecommendation | null>(
    recommendations[0] ?? null,
  );

  const top = React.useMemo(() => recommendations.slice(0, 9), [recommendations]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let raf = 0;

    // Normalised against the data's own range rather than assumed units.
    // `liftPct` is a decimal fraction from the engine, not a percentage, and
    // hard-coding a ceiling for either axis collapses the field to one corner.
    const hours = top.map((r) => r.effectiveHours);
    const lifts = top.map((r) => r.liftPct);
    const minHours = Math.min(...hours);
    const maxHours = Math.max(...hours);
    const minLift = Math.min(...lifts);
    const maxLift = Math.max(...lifts);
    const hoursSpan = Math.max(1e-6, maxHours - minHours);
    const liftSpan = Math.max(1e-6, maxLift - minLift);
    const maxIndex = Math.max(1, ...top.map((r) => r.arbitrageIndex));

    function layout() {
      const rect = wrap!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;

      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const padX = 78;
      const padY = 46;

      nodesRef.current = top.map((rec, i) => {
        const hx = padX + ((rec.effectiveHours - minHours) / hoursSpan) * (width - padX * 2);
        // Canvas y grows downward; lift should read upward.
        const hy = height - padY - ((rec.liftPct - minLift) / liftSpan) * (height - padY * 2);
        const existing = nodesRef.current[i];

        return {
          rec,
          hx,
          hy,
          x: existing?.x ?? hx,
          y: existing?.y ?? hy,
          vx: 0,
          vy: 0,
          r: 5.5 + (rec.arbitrageIndex / maxIndex) * 7.5,
          phase: (i / top.length) * Math.PI * 2,
          colour: QUADRANT_COLOUR[rec.quadrant],
          glow: rec.quadrant === "quick-win" || rec.quadrant === "strategic",
        };
      });
    }

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(wrap);

    let t = 0;

    function frame() {
      t += 0.016;
      ctx!.clearRect(0, 0, width, height);

      const nodes = nodesRef.current;
      const pointer = pointerRef.current;

      // ---------------------------------------------------------- tracers
      // Lines between nodes that are near each other in the field, which is
      // to say skills with comparable effort-to-return profiles.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!;
          const b = nodes[j]!;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > 150) continue;

          const alpha = (1 - d / 150) * 0.16;
          ctx!.strokeStyle = `rgba(148, 190, 255, ${alpha})`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      // --------------------------------------------------------- shockwave
      ringsRef.current = ringsRef.current.filter((ring) => {
        ring.t += 0.028;
        if (ring.t >= 1) return false;

        const radius = 12 + ring.t * 120;
        ctx!.strokeStyle = hexToRgba(ring.colour, (1 - ring.t) * 0.5);
        ctx!.lineWidth = 2 * (1 - ring.t);
        ctx!.beginPath();
        ctx!.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
        ctx!.stroke();
        return true;
      });

      // ------------------------------------------------------------ nodes
      for (const n of nodes) {
        // Bob around the true position, never far enough to misread the axis.
        const bobX = reduced ? 0 : Math.sin(t * 0.7 + n.phase) * 3.5;
        const bobY = reduced ? 0 : Math.cos(t * 0.55 + n.phase) * 4;

        let targetX = n.hx + bobX;
        let targetY = n.hy + bobY;

        // Cursor gravity, capped so a node can't be dragged off its meaning.
        if (pointer.active) {
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const d = Math.hypot(dx, dy);
          if (d < 170 && d > 0.01) {
            const pull = (1 - d / 170) * 14;
            targetX += (dx / d) * pull;
            targetY += (dy / d) * pull;
          }
        }

        // Critically damped-ish spring back toward home.
        n.vx += (targetX - n.x) * 0.06;
        n.vy += (targetY - n.y) * 0.06;
        n.vx *= 0.82;
        n.vy *= 0.82;
        n.x += n.vx;
        n.y += n.vy;

        const isHover = hoveredIdRef.current === n.rec.skillId;

        // Pulsing aura on the high-return nodes.
        if (n.glow) {
          const pulse = reduced ? 0.5 : (Math.sin(t * 1.8 + n.phase) + 1) / 2;
          const ringR = n.r + 6 + pulse * 9;
          ctx!.strokeStyle = hexToRgba(n.colour, 0.14 + pulse * 0.2);
          ctx!.lineWidth = 1.5;
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, ringR, 0, Math.PI * 2);
          ctx!.stroke();
        }

        const halo = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3.4);
        halo.addColorStop(0, hexToRgba(n.colour, isHover ? 0.5 : 0.32));
        halo.addColorStop(1, hexToRgba(n.colour, 0));
        ctx!.fillStyle = halo;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r * 3.4, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.fillStyle = n.colour;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, isHover ? n.r * 1.12 : n.r, 0, Math.PI * 2);
        ctx!.fill();

        // Specular highlight so the orb reads as a sphere, not a dot.
        ctx!.fillStyle = "rgba(255,255,255,0.32)";
        ctx!.beginPath();
        ctx!.arc(n.x - n.r * 0.3, n.y - n.r * 0.32, n.r * 0.3, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [top]);

  // Kept in a ref so the animation loop doesn't restart on hover.
  const hoveredIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    hoveredIdRef.current = hovered?.rec.skillId ?? null;
  }, [hovered]);

  function hitTest(clientX: number, clientY: number) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    pointerRef.current = { x, y, active: true };

    for (const n of nodesRef.current) {
      if (Math.hypot(n.x - x, n.y - y) <= n.r + 9) return { node: n, x, y };
    }
    return null;
  }

  return (
    <div className="relative">
      {/* The canvas conveys nothing to assistive technology, so the same data
          ships as a table. Visually hidden, not hidden from the accessibility
          tree — this is the chart, for anyone not using a pointer. */}
      <table className="sr-only">
        <caption>Skills ranked by pay lift against effective study hours</caption>
        <thead>
          <tr>
            <th scope="col">Skill</th>
            <th scope="col">Pay lift</th>
            <th scope="col">Effective study hours</th>
            <th scope="col">Category</th>
          </tr>
        </thead>
        <tbody>
          {top.map((r) => (
            <tr key={r.skillId}>
              <th scope="row">{r.skillName}</th>
              <td>{formatCurrency(r.salaryLift, currencyCode)}</td>
              <td>{r.effectiveHours}</td>
              <td>{r.quadrant.replace("-", " ")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div ref={wrapRef} aria-hidden="true" className="relative h-[340px] w-full sm:h-[380px]">
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-crosshair"
          onMouseMove={(e) => {
            const hit = hitTest(e.clientX, e.clientY);
            setHovered(hit ? { rec: hit.node.rec, x: hit.x, y: hit.y } : null);
          }}
          onMouseLeave={() => {
            pointerRef.current = { x: -9999, y: -9999, active: false };
            setHovered(null);
          }}
          onClick={(e) => {
            const hit = hitTest(e.clientX, e.clientY);
            if (!hit) return;
            ringsRef.current.push({ x: hit.node.x, y: hit.node.y, t: 0, colour: hit.node.colour });
            setSelected(hit.node.rec);
          }}
        />

        {/* Axis captions — without these the field is decoration. */}
        <span className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted-foreground/60">
          effective study hours →
        </span>
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted-foreground/60">
          pay lift →
        </span>

        {hovered && (
          <div
            className="panel pointer-events-none absolute z-10 min-w-[190px] rounded-lg px-3.5 py-3"
            style={{
              left: Math.min(Math.max(hovered.x + 16, 8), 999),
              top: Math.max(hovered.y - 70, 8),
            }}
          >
            <p className="text-sm font-semibold tracking-tight">{hovered.rec.skillName}</p>
            <dl className="mt-2 space-y-1">
              <Row
                label="Hourly yield"
                value={`${formatCurrency(
                  hovered.rec.salaryLift / Math.max(1, hovered.rec.effectiveHours),
                  currencyCode,
                )}/hr`}
              />
              <Row
                label="Pay jump"
                value={`+${formatCurrency(hovered.rec.salaryLift, currencyCode)} · ${formatPercent(hovered.rec.liftPct)}`}
                tone="text-[hsl(var(--lift))]"
              />
              <Row label="Study" value={`${hovered.rec.effectiveHours}h`} />
            </dl>
          </div>
        )}
      </div>

      {/* Readout — clicking a node writes here. */}
      {selected && (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-white/[0.06] px-1 pt-4">
          <div>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted-foreground">
              Selected
            </p>
            <p className="mt-0.5 text-sm font-semibold tracking-tight">{selected.skillName}</p>
          </div>
          <div>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted-foreground">
              Pay jump
            </p>
            <p className="tabular mt-0.5 font-mono text-sm font-medium text-[hsl(var(--lift))]">
              +{formatCurrency(selected.salaryLift, currencyCode)}
            </p>
          </div>
          <div>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted-foreground">
              Hourly yield
            </p>
            <p className="tabular mt-0.5 font-mono text-sm font-medium">
              {formatCurrency(
                selected.salaryLift / Math.max(1, selected.effectiveHours),
                currencyCode,
              )}
              /hr
            </p>
          </div>
          <p className="font-mono text-[0.625rem] text-muted-foreground/60">click any node</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </dt>
      <dd className={`tabular font-mono text-xs font-medium ${tone ?? ""}`}>{value}</dd>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
