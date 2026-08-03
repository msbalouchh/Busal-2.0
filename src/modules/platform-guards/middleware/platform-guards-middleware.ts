import { type NextRequest, NextResponse } from "next/server";

import { ROUTES } from "@/constants/routes";
import {
  AUTH_ROUTES,
  CUSTOMER_PORTAL_PUBLIC_ROUTES,
  PLATFORM_API_PREFIX,
  PLATFORM_DASHBOARD_PREFIX,
  PLATFORM_PROTECTED_API_ROUTES,
  PLATFORM_PUBLIC_API_ROUTES,
  PROTECTED_ROUTES,
} from "@/modules/platform-guards/constants/routes";

export function isPlatformDashboardRoute(pathname: string): boolean {
  return (
    pathname === PLATFORM_DASHBOARD_PREFIX || pathname.startsWith(`${PLATFORM_DASHBOARD_PREFIX}/`)
  );
}

export function isPlatformProtectedAppRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isCustomerPortalRoute(pathname: string): boolean {
  return pathname === ROUTES.customerPortal || pathname.startsWith(`${ROUTES.customerPortal}/`);
}

export function isCustomerPortalPublicRoute(pathname: string): boolean {
  return CUSTOMER_PORTAL_PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isCustomerPortalProtectedRoute(pathname: string): boolean {
  return isCustomerPortalRoute(pathname) && !isCustomerPortalPublicRoute(pathname);
}

export function isPlatformAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isBusinessAuthRoute(pathname: string): boolean {
  return [ROUTES.login, ROUTES.signup, ROUTES.forgotPassword].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isCustomerPortalAuthRoute(pathname: string): boolean {
  return [ROUTES.customerPortalLogin, ROUTES.customerPortalRegister].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isPlatformApiRoute(pathname: string): boolean {
  return pathname === PLATFORM_API_PREFIX || pathname.startsWith(`${PLATFORM_API_PREFIX}/`);
}

export function isPlatformPublicApiRoute(pathname: string): boolean {
  return PLATFORM_PUBLIC_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isPlatformProtectedApiRoute(pathname: string): boolean {
  if (isPlatformPublicApiRoute(pathname)) {
    return false;
  }

  return (
    isPlatformApiRoute(pathname) ||
    PLATFORM_PROTECTED_API_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    )
  );
}

export function redirectUnauthenticatedToLogin(
  request: NextRequest,
  pathname: string,
): NextResponse {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = isCustomerPortalRoute(pathname)
    ? ROUTES.customerPortalLogin
    : ROUTES.login;
  redirectUrl.searchParams.set("redirectTo", pathname);
  return NextResponse.redirect(redirectUrl);
}

export function redirectAuthenticatedToAuthContinue(request: NextRequest): NextResponse {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = ROUTES.authContinue;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

export function redirectAuthenticatedToDashboard(request: NextRequest): NextResponse {
  return redirectAuthenticatedToAuthContinue(request);
}

export function redirectAuthenticatedToCustomerPortal(request: NextRequest): NextResponse {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = ROUTES.customerPortal;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

export function unauthenticatedApiResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "Authentication required",
      code: "UNAUTHENTICATED",
    },
    { status: 401 },
  );
}

export function evaluatePlatformMiddlewareAccess(options: {
  pathname: string;
  hasSession: boolean;
}): NextResponse | null {
  const { pathname, hasSession } = options;

  if (
    (isPlatformProtectedAppRoute(pathname) || isPlatformProtectedApiRoute(pathname)) &&
    !hasSession
  ) {
    if (isPlatformProtectedApiRoute(pathname)) {
      return unauthenticatedApiResponse();
    }

    return null;
  }

  if (isPlatformAuthRoute(pathname) && hasSession) {
    return null;
  }

  return null;
}
