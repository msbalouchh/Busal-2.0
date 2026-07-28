import { NextResponse } from "next/server";

import { authSuccess, handleAuthRouteError } from "@/modules/auth/lib/api-response";
import { getStaffSessionCookie } from "@/modules/staff-auth/services/staff-session.service";
import { refreshStaffSession } from "@/modules/staff-auth/services/staff-auth.service";
import { getSession, refreshSession } from "@/services/auth.service";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const staffSession = await getStaffSessionCookie();

    return authSuccess({ user: session.user, staffSession });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}

/** Refreshes the Supabase session cookies and returns the current user. */
export async function POST() {
  try {
    const session = await refreshSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const staffSession = await refreshStaffSession(session.user.id, session.user.email);

    return authSuccess({
      user: session.user,
      staffSession,
    });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
