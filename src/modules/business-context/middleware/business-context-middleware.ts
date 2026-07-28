import "server-only";

import type { NextRequest } from "next/server";

import {
  ACTIVE_BRANCH_COOKIE,
  ACTIVE_BUSINESS_COOKIE,
} from "@/modules/business-context/constants/session";

export function hasActiveBusinessCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get(ACTIVE_BUSINESS_COOKIE)?.value);
}

export function hasActiveBranchCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get(ACTIVE_BRANCH_COOKIE)?.value);
}

export function clearBusinessContextCookieHeaders(): [string, string][] {
  return [
    [`${ACTIVE_BUSINESS_COOKIE}=`, "Path=/; Max-Age=0; HttpOnly; SameSite=Lax"],
    [`${ACTIVE_BRANCH_COOKIE}=`, "Path=/; Max-Age=0; HttpOnly; SameSite=Lax"],
  ];
}
