import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const bodySchema = z.object({
  slug: z.string().min(1).max(80),
  placement: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  const raw: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  // An attribution beacon should never surface an error to the user.
  if (!parsed.success) return new NextResponse(null, { status: 204 });

  const partner = await prisma.partner.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (!partner) return new NextResponse(null, { status: 204 });

  const user = await getSessionUser();
  await prisma.partnerClick.create({
    data: {
      partnerId: partner.id,
      placement: parsed.data.placement,
      userId: user?.id,
    },
  });

  return new NextResponse(null, { status: 204 });
}
