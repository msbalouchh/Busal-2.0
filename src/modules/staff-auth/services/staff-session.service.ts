import "server-only";

import { cookies } from "next/headers";

import { STAFF_SESSION_COOKIE } from "@/modules/staff-auth/constants/session";
import type { StaffSessionData } from "@/modules/staff-auth/types/staff-session";
import { StaffAuthError } from "@/modules/staff-auth/utils/staff-auth-errors";

function encodeSession(session: StaffSessionData): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

function decodeSession(value: string): StaffSessionData | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as StaffSessionData;

    if (
      !parsed.staffId ||
      !parsed.userId ||
      !parsed.businessId ||
      !parsed.roleSlug ||
      !Array.isArray(parsed.permissions)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function getStaffSessionCookie(): Promise<StaffSessionData | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(STAFF_SESSION_COOKIE)?.value;
  return value ? decodeSession(value) : null;
}

export async function setStaffSessionCookie(session: StaffSessionData): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(STAFF_SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearStaffSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_SESSION_COOKIE);
}

export async function requireStaffSessionCookie(): Promise<StaffSessionData> {
  const session = await getStaffSessionCookie();

  if (!session) {
    throw new StaffAuthError("SESSION_INVALID");
  }

  return session;
}

export async function refreshStaffSessionCookie(session: StaffSessionData): Promise<void> {
  await setStaffSessionCookie(session);
}
