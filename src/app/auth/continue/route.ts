import "server-only";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { resolvePublicAppUrl } from "@/config/app-url";
import { ROUTES } from "@/constants/routes";
import { persistBusinessContextCookiesForLogin } from "@/modules/business-context/services/business-context-cookie-writer.service";
import { resolveAuthRouteErrorMessage } from "@/modules/auth/lib/auth-route-errors";
import { resolvePostAuthRedirect } from "@/modules/auth/lib/post-auth-redirect";
import { ACCOUNT_TYPES } from "@/modules/staff-auth/constants/session";
import { completeLoginSession } from "@/modules/staff-auth/services/staff-auth.service";
import { getCurrentUser } from "@/services/auth.service";

function redirectToLoginWithError(message: string) {
  const url = new URL(ROUTES.login, resolvePublicAppUrl());
  url.searchParams.set("auth_error", message);
  return NextResponse.redirect(url);
}

/** Resolves workspace-aware destination for authenticated sessions. */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      redirect(ROUTES.login);
    }

    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get("redirectTo");

    const loginResult = await completeLoginSession(user.id, user.email);
    if (loginResult.accountType === ACCOUNT_TYPES.OWNER || loginResult.staffSession) {
      await persistBusinessContextCookiesForLogin(user, loginResult);
    }

    const destination = await resolvePostAuthRedirect(user, redirectTo);

    redirect(destination);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("[auth/continue]", error);

    return redirectToLoginWithError(resolveAuthRouteErrorMessage(error));
  }
}
