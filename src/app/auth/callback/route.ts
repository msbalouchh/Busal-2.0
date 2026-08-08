import { NextResponse } from "next/server";

import { ROUTES } from "@/constants/routes";
import { resolvePublicAppUrl } from "@/config/app-url";
import { persistBusinessContextCookiesForLogin } from "@/modules/business-context/services/business-context-cookie-writer.service";
import { resolvePostAuthRedirect } from "@/modules/auth/lib/post-auth-redirect";
import { ACCOUNT_TYPES } from "@/modules/staff-auth/constants/session";
import { completeLoginSession } from "@/modules/staff-auth/services/staff-auth.service";
import { AuthServiceError, exchangeCodeForSession, getCurrentUser } from "@/services/auth.service";

function redirectWithError(message: string) {
  const url = new URL(ROUTES.home, resolvePublicAppUrl());
  url.searchParams.set("auth_error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const appOrigin = resolvePublicAppUrl();

  if (errorParam) {
    return redirectWithError(errorDescription ?? "Authentication failed. Please try again.");
  }

  if (!code) {
    return redirectWithError("Missing authentication code.");
  }

  try {
    await exchangeCodeForSession(code);

    const user = await getCurrentUser();

    if (!user) {
      return redirectWithError("Unable to establish a session.");
    }

    const loginResult = await completeLoginSession(user.id, user.email);
    if (loginResult.accountType === ACCOUNT_TYPES.OWNER || loginResult.staffSession) {
      await persistBusinessContextCookiesForLogin(user, loginResult);
    }

    const redirectPath = await resolvePostAuthRedirect(user, next);
    return NextResponse.redirect(new URL(redirectPath, appOrigin));
  } catch (error) {
    const message =
      error instanceof AuthServiceError ? error.message : "Unable to complete authentication.";

    return redirectWithError(message);
  }
}
