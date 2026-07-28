import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { ROUTES } from "@/constants/routes";
import { resolvePublicAppUrl } from "@/config/app-url";
import { STAFF_SESSION_COOKIE } from "@/modules/staff-auth/constants/session";

export function hasStaffSessionCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get(STAFF_SESSION_COOKIE)?.value);
}

export function createStaffSessionInvalidResponse(): NextResponse {
  const response = NextResponse.redirect(new URL(ROUTES.login, resolvePublicAppUrl()));
  response.cookies.delete(STAFF_SESSION_COOKIE);
  return response;
}
