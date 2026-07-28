import { NextResponse } from "next/server";

import { ROUTES } from "@/constants/routes";
import { resolveRedirectPath } from "@/modules/auth/lib/auth.utils";
import { AuthServiceError, exchangeCodeForSession } from "@/services/auth.service";

function redirectWithError(origin: string, message: string) {
  const url = new URL(ROUTES.home, origin);
  url.searchParams.set("auth_error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam) {
    return redirectWithError(
      origin,
      errorDescription ?? "Authentication failed. Please try again.",
    );
  }

  if (!code) {
    return redirectWithError(origin, "Missing authentication code.");
  }

  try {
    await exchangeCodeForSession(code);

    const redirectPath = resolveRedirectPath(next, ROUTES.dashboard);
    return NextResponse.redirect(new URL(redirectPath, origin));
  } catch (error) {
    const message =
      error instanceof AuthServiceError ? error.message : "Unable to complete authentication.";

    return redirectWithError(origin, message);
  }
}
