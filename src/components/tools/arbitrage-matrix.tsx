"use client";

import * as React from "react";
import {
  CartesianGrid,
  Label as RLabel,
  ReferenceArea,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import type { ArbitrageRecommendation } from "@/types";
import { formatCurrency } from "@/lib/utils";

const QUADRANT_COLOR: Record<ArbitrageRecommendation["quadrant"], string> = {
  "quick-win": "hsl(var(--lift))",
  strategic: "hsl(var(--primary))",
  incremental: "hsl(var(--muted-foreground))",
  "long-haul": "hsl(var(--caution))",
};

const QUADRANT_TEXT = (q: ArbitrageRecommendation["quadrant"]) => ({
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  fill: QUADRANT_COLOR[q],
  opacity: 0.75,
});

export const QUADRANT_LABEL: Record<ArbitrageRecommendation["quadrant"], string> = {
  "quick-win": "Quick win",
  strategic: "Strategic bet",
  incremental: "Incremental",
  "long-haul": "Long haul",
};

interface MatrixPoint {
  hours: number;
  liftPct: number;
  salaryLift: number;
  name: string;
  quadrant: ArbitrageRecommendation["quadrant"];
  index: number;
}

interface ArbitrageMatrixProps {
  recommendations: ArbitrageRecommendation[];
  currencyCode: string;
}

export function ArbitrageMatrix({ recommendations, currencyCode }: ArbitrageMatrixProps) {
  const points: MatrixPoint[] = React.useMemo(
    () =>
      recommendations.slice(0, 14).map((r) => ({
        hours: r.effectiveHours,
        liftPct: Number((r.liftPct * 100).toFixed(2)),
        salaryLift: r.salaryLift,
        name: r.skillName,
        quadrant: r.quadrant,
        index: r.arbitrageIndex,
      })),
    [recommendations],
  );

  if (points.length === 0) return null;

  // Zones are drawn to the data's own extent, so they never clip the points.
  const maxHours = Math.max(180, ...points.map((p) => p.hours)) * 1.05;
  const maxLift = Math.max(20, ...points.map((p) => p.liftPct)) * 1.08;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Effort against return</h3>
          <p className="text-sm text-muted-foreground">
            Bottom-left of the chart is where the arbitrage lives: real pay movement for
            hours you can actually find.
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          bigger circle = better value per hour
        </p>
      </div>

      <div className="h-[360px] w-full rounded-lg border bg-card p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 20, bottom: 28, left: 8 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" />
            <XAxis
              type="number"
              dataKey="hours"
              name="Study hours"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              label={{
                value: "Effective study hours",
                position: "insideBottom",
                offset: -16,
                style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <YAxis
              type="number"
              dataKey="liftPct"
              name="Salary lift"
              unit="%"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              width={44}
            />
            <ZAxis type="number" dataKey="index" range={[70, 380]} />

            {/* Quadrants, shaded and named in place. Thresholds mirror the
                engine: 70 effective hours, 9% lift. */}
            <ReferenceArea
              x1={0} x2={70} y1={9} y2={maxLift}
              fill={QUADRANT_COLOR["quick-win"]} fillOpacity={0.07} stroke="none"
            >
              <RLabel value="SWEET SPOT · HIGH LIFT / LOW STUDY" position="insideTopLeft" style={QUADRANT_TEXT("quick-win")} />
            </ReferenceArea>
            <ReferenceArea
              x1={70} x2={maxHours} y1={9} y2={maxLift}
              fill={QUADRANT_COLOR.strategic} fillOpacity={0.07} stroke="none"
            >
              <RLabel value="STRATEGIC" position="insideTopRight" style={QUADRANT_TEXT("strategic")} />
            </ReferenceArea>
            <ReferenceArea
              x1={0} x2={70} y1={0} y2={9}
              fill={QUADRANT_COLOR.incremental} fillOpacity={0.05} stroke="none"
            >
              <RLabel value="INCREMENTAL" position="insideBottomLeft" style={QUADRANT_TEXT("incremental")} />
            </ReferenceArea>
            <ReferenceArea
              x1={70} x2={maxHours} y1={0} y2={9}
              fill={QUADRANT_COLOR["long-haul"]} fillOpacity={0.06} stroke="none"
            >
              <RLabel value="LONG-HAUL BETS" position="insideBottomRight" style={QUADRANT_TEXT("long-haul")} />
            </ReferenceArea>

            <ReferenceLine x={70} stroke="hsl(var(--border))" strokeDasharray="4 4" />
            <ReferenceLine y={9} stroke="hsl(var(--border))" strokeDasharray="4 4" />

            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "hsl(var(--border))" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload as MatrixPoint | undefined;
                if (!p) return null;
                return (
                  <div className="panel min-w-[190px] rounded-lg px-3.5 py-3">
                    <p className="text-sm font-semibold tracking-tight">{p.name}</p>

                    <dl className="mt-2.5 space-y-1.5">
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-muted-foreground">
                          Hourly yield
                        </dt>
                        <dd className="tabular font-mono text-xs font-medium">
                          {formatCurrency(p.salaryLift / Math.max(1, p.hours), currencyCode)}/hr
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-muted-foreground">
                          Pay jump
                        </dt>
                        <dd className="tabular font-mono text-xs font-medium text-[hsl(var(--lift))]">
                          +{p.liftPct.toFixed(1)}%
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-muted-foreground">
                          Study
                        </dt>
                        <dd className="tabular font-mono text-xs font-medium">{p.hours}h</dd>
                      </div>
                    </dl>

                    <p
                      className="mt-2.5 border-t border-white/[0.08] pt-2 font-mono text-[0.6875rem] uppercase tracking-[0.1em]"
                      style={{ color: QUADRANT_COLOR[p.quadrant] }}
                    >
                      {QUADRANT_LABEL[p.quadrant]}
                    </p>
                  </div>
                );
              }}
            />

            <Scatter data={points} fillOpacity={0.9}>
              {points.map((p) => (
                <Cell
                  key={p.name}
                  fill={QUADRANT_COLOR[p.quadrant]}
                  // The best-return nodes carry a glow so the eye lands there
                  // before it reads any axis.
                  style={
                    p.quadrant === "quick-win"
                      ? { filter: `drop-shadow(0 0 6px ${QUADRANT_COLOR["quick-win"]})` }
                      : undefined
                  }
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
