import "server-only";

import { cookies } from "next/headers";

import {
  ACTIVE_BRANCH_COOKIE,
  ACTIVE_BUSINESS_COOKIE,
} from "@/modules/business-context/constants/session";
import type {
  ActiveBranchCookie,
  ActiveBusinessCookie,
} from "@/modules/business-context/types/business-context";

function encodeCookie<T>(value: T): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeCookie<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function getActiveBusinessCookie(): Promise<ActiveBusinessCookie | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;
  return value ? decodeCookie<ActiveBusinessCookie>(value) : null;
}

export async function setActiveBusinessCookie(value: ActiveBusinessCookie): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, encodeCookie(value), cookieOptions);
}

export async function clearActiveBusinessCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_BUSINESS_COOKIE);
}

export async function getActiveBranchCookie(): Promise<ActiveBranchCookie | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ACTIVE_BRANCH_COOKIE)?.value;
  return value ? decodeCookie<ActiveBranchCookie>(value) : null;
}

export async function setActiveBranchCookie(value: ActiveBranchCookie): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BRANCH_COOKIE, encodeCookie(value), cookieOptions);
}

export async function clearActiveBranchCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_BRANCH_COOKIE);
}

export async function clearBusinessContextCookies(): Promise<void> {
  await clearActiveBusinessCookie();
  await clearActiveBranchCookie();
}
