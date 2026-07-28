import { NextResponse } from "next/server";

import { authSuccess, handleAuthRouteError } from "@/modules/auth/lib/api-response";
import { getGoogleOAuthUrl } from "@/services/auth.service";

export async function GET() {
  try {
    const url = await getGoogleOAuthUrl();
    return authSuccess({ url });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
