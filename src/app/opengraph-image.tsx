import { ImageResponse } from "next/og";

import { calculateSkillArbitrage } from "@/lib/engines/skill-arbitrage";
import { formatCurrency } from "@/lib/utils";

export const alt = "CareerEdge — what the market actually pays";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card runs the engine too, so the number on it is the same number
 * on the page rather than a screenshot that goes stale.
 */
export default async function OpengraphImage() {
  const run = calculateSkillArbitrage({
    currentRoleId: "frontend-engineer",
    currentSkillIds: ["typescript", "react", "tailwind"],
    marketId: "austin",
    currencyCode: "USD",
    yearsExperience: 5,
    weeklyStudyHours: 6,
  });

  const top = run.recommendations[0];

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0F0F11",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: "#3B82F6",
            }}
          />
          <div style={{ display: "flex", color: "#FAFAFA", fontSize: 30, fontWeight: 600 }}>
            CareerEdge
          </div>
          <div style={{ display: "flex", color: "#8A8A93", fontSize: 24 }}>
            what the market actually pays
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              color: "#FAFAFA",
              fontSize: 62,
              lineHeight: 1.1,
              letterSpacing: -1.6,
              maxWidth: 900,
            }}
          >
            Every career decision is a price you either negotiated or accepted.
          </div>

          {top && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 40 }}>
              <div style={{ display: "flex", color: "#34D399", fontSize: 52, fontWeight: 700 }}>
                +{formatCurrency(top.salaryLift, run.currencyCode)}
              </div>
              <div style={{ display: "flex", color: "#8A8A93", fontSize: 26 }}>
                adding {top.skillName} · {top.effectiveHours} hours of study
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", color: "#8A8A93", fontSize: 22 }}>
          Skill ROI · COLA pay · CTC to in-hand · JD simplifier
        </div>
      </div>
    ),
    size,
  );
}
