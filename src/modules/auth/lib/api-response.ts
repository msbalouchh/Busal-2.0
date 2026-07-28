import { NextResponse } from "next/server";

import { AuthServiceError } from "@/services/auth.service";
import { StaffAuthError } from "@/modules/staff-auth/utils/staff-auth-errors";

export function authSuccess<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function authError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function handleAuthRouteError(error: unknown) {
  if (error instanceof AuthServiceError) {
    const status = error.code === "UNAUTHORIZED" ? 401 : 400;
    return authError(error.message, status);
  }

  if (error instanceof StaffAuthError) {
    const status = error.code === "INVALID_CREDENTIALS" ? 401 : 403;
    return authError(error.message, status);
  }

  console.error("[auth]", error);
  return authError("An unexpected error occurred.", 500);
}
