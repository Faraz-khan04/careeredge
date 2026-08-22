import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { leadCaptureSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/moderation";
import { requestFingerprint, getSessionUser } from "@/lib/session";

export async function POST(request: Request) {
  const limit = checkRateLimit(`lead:${await requestFingerprint()}`, 5, 60 * 60 * 1000);
  if (limit.blocked) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = leadCaptureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form and try again." },
      { status: 422 },
    );
  }

  const user = await getSessionUser();
  const data = parsed.data;

  // A repeat unlock of the same asset refreshes the record rather than
  // creating a duplicate lead — the unique constraint enforces it either way.
  const lead = await prisma.lead.upsert({
    where: { email_unlockedAsset: { email: data.email, unlockedAsset: data.unlockedAsset } },
    create: {
      email: data.email,
      currentRole: data.currentRole,
      yearsExperience: data.yearsExperience,
      unlockedAsset: data.unlockedAsset,
      source: data.source,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      userId: user?.id,
    },
    update: {
      currentRole: data.currentRole,
      yearsExperience: data.yearsExperience,
    },
    select: { id: true },
  });

  // Hand off to your ESP here (Resend, Customer.io, Loops) to deliver the asset.

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
