import { NextResponse } from "next/server";

import { authSuccess, handleAuthRouteError } from "@/modules/auth/lib/api-response";
import { ROUTES } from "@/constants/routes";
import { getAppOrigin } from "@/modules/auth/lib/auth.utils";
import { clearActiveBusinessContext } from "@/modules/business-context/services/business-context.service";
import { clearStaffSession } from "@/modules/staff-auth/services/staff-auth.service";
import { signOut } from "@/services/auth.service";

export async function POST() {
  try {
    await clearStaffSession();
    await clearActiveBusinessContext();
    await signOut();
    return authSuccess({ message: "Signed out successfully" });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}

export async function GET() {
  return NextResponse.redirect(new URL(ROUTES.home, getAppOrigin()));
}
