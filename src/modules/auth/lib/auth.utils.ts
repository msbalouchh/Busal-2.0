import { ROUTES } from "@/constants/routes";
import { buildAppUrl, resolvePublicAppUrl } from "@/config/app-url";

export function getAppOrigin(): string {
  return resolvePublicAppUrl();
}

export function buildAppUrlFromOrigin(path: string): string {
  return buildAppUrl(path);
}

export function getAuthCallbackUrl(next?: string): string {
  const callbackUrl = new URL(buildAppUrl(ROUTES.authCallback));

  if (next) {
    callbackUrl.searchParams.set("next", next);
  }

  return callbackUrl.toString();
}

export function getPasswordResetRedirectUrl(): string {
  return getAuthCallbackUrl(ROUTES.resetPassword);
}

export function isValidInternalRedirect(path: string | null | undefined): path is string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

export function resolveRedirectPath(
  path: string | null | undefined,
  fallback = ROUTES.dashboard,
): string {
  return isValidInternalRedirect(path) ? path : fallback;
}
