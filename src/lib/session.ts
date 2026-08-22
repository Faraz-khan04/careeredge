import "server-only";

import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Authentication stub.
 *
 * Swap `getSessionUser` for your provider (NextAuth, Clerk, Supabase Auth) and
 * every route below keeps working — they only depend on this contract. Until
 * then it resolves the seeded demo account so the app is usable end to end.
 */
export interface SessionUser {
  id: string;
  handle: string;
  badge: string | null;
  isVerified: boolean;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const handle = cookieStore.get("ce_demo_user")?.value ?? "throwaway_dev";

  const user = await prisma.user.findUnique({
    where: { handle },
    select: {
      id: true,
      handle: true,
      currentRole: true,
      yearsExperience: true,
      verification: true,
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    handle: user.handle,
    badge:
      user.currentRole && user.yearsExperience !== null
        ? `${user.currentRole} | ${user.yearsExperience} YOE`
        : null,
    isVerified: user.verification === "VERIFIED",
  };
}

/** Stable per-request key for rate limiting logged-out traffic. */
export async function requestFingerprint(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  return `${ip}:${h.get("user-agent")?.slice(0, 40) ?? ""}`;
}
