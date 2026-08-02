import { NextResponse } from "next/server";

import { authError, authSuccess, handleAuthRouteError } from "@/modules/auth/lib/api-response";
import { resolvePostAuthRedirect } from "@/modules/auth/lib/post-auth-redirect";
import { loginSchema } from "@/schemas/auth.schema";
import { ACCOUNT_TYPES } from "@/modules/staff-auth/constants/session";
import { completeLoginSession } from "@/modules/staff-auth/services/staff-auth.service";
import { persistBusinessContextCookiesForLogin } from "@/modules/business-context/services/business-context-cookie-writer.service";
import { signInWithEmail } from "@/services/auth.service";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "Invalid request body";
      return authError(message, 422);
    }

    const session = await signInWithEmail(parsed.data.email, parsed.data.password);
    const loginResult = await completeLoginSession(session.user.id, session.user.email);
    await persistBusinessContextCookiesForLogin(session.user, loginResult);

    const redirectPath = await resolvePostAuthRedirect(
      session.user,
      parsed.data.redirectTo ?? null,
    );

    return authSuccess({
      user: session.user,
      redirectPath,
      accountType: loginResult.accountType,
      staffSession:
        loginResult.accountType === ACCOUNT_TYPES.STAFF ? loginResult.staffSession : null,
    });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
