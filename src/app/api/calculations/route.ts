import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { skillArbitrageInputSchema, remotePayEquityInputSchema } from "@/lib/schemas";
import { calculateSkillArbitrage } from "@/lib/engines/skill-arbitrage";
import { calculateRemotePayEquity } from "@/lib/engines/remote-pay-equity";
import { getSessionUser, requestFingerprint } from "@/lib/session";
import { checkRateLimit } from "@/lib/moderation";

const bodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("SKILL_ARBITRAGE"), input: skillArbitrageInputSchema }),
  z.object({ type: z.literal("REMOTE_PAY_EQUITY"), input: remotePayEquityInputSchema }),
]);

export async function POST(request: Request) {
  const limit = checkRateLimit(`calc:${await requestFingerprint()}`, 40, 60 * 60 * 1000);
  if (limit.blocked) {
    return NextResponse.json({ error: "Too many calculations. Take a breath." }, { status: 429 });
  }

  const raw: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid calculation payload." }, { status: 422 });
  }

  const user = await getSessionUser();
  const { type, input } = parsed.data;

  // The client sends its own result for a fast render, but the stored snapshot
  // is always recomputed here. A tampered payload can't be embedded as fact.
  if (type === "SKILL_ARBITRAGE") {
    const result = calculateSkillArbitrage(input);
    const record = await prisma.calculationHistory.create({
      data: {
        type,
        input,
        result: result as unknown as object,
        engineVersion: result.engineVersion,
        headlineValue: Number(result.stackedLift.salaryLift.toFixed(2)),
        currencyCode: result.currencyCode,
        userId: user?.id,
      },
      select: { id: true },
    });
    return NextResponse.json({ id: record.id }, { status: 201 });
  }

  const result = calculateRemotePayEquity(input);
  const record = await prisma.calculationHistory.create({
    data: {
      type,
      input,
      result: result as unknown as object,
      engineVersion: result.engineVersion,
      headlineValue: Number(result.netEffectiveValue.toFixed(2)),
      currencyCode: result.currencyCode,
      employment: input.employment,
      userId: user?.id,
    },
    select: { id: true },
  });
  return NextResponse.json({ id: record.id }, { status: 201 });
}
