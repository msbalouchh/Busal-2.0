import { type NextRequest, NextResponse } from "next/server";

import { resolveCanonicalOriginForHost } from "@/config/app-url";
import { USER_ROLES } from "@/constants/roles";
import { createClient } from "@/lib/supabase/middleware";
import {
  isBusinessAuthRoute,
  isCustomerPortalAuthRoute,
  isCustomerPortalProtectedRoute,
  isPlatformAuthRoute,
  isPlatformProtectedApiRoute,
  isPlatformProtectedAppRoute,
  redirectAuthenticatedToCustomerPortal,
  redirectAuthenticatedToDashboard,
  redirectUnauthenticatedToLogin,
  unauthenticatedApiResponse,
} from "@/modules/platform-guards/middleware/platform-guards-middleware";

function resolveUserRole(user: { user_metadata?: Record<string, unknown> }): string {
  const role = user.user_metadata?.role;
  return typeof role === "string" ? role : USER_ROLES.OWNER;
}

export async function middleware(request: NextRequest) {
  const canonicalOrigin = resolveCanonicalOriginForHost(request.headers.get("host"));

  if (canonicalOrigin) {
    const redirectUrl = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      canonicalOrigin,
    );

    return NextResponse.redirect(redirectUrl, 308);
  }

  const { supabase, supabaseResponse } = createClient(request);
  const pathname = request.nextUrl.pathname;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedAppRoute = isPlatformProtectedAppRoute(pathname);
  const isProtectedApiRoute = isPlatformProtectedApiRoute(pathname);
  const isPortalProtectedRoute = isCustomerPortalProtectedRoute(pathname);
  const isAuthRoute = isPlatformAuthRoute(pathname);
  const userRole = user ? resolveUserRole(user) : null;
  const isCustomerUser = userRole === USER_ROLES.CUSTOMER;

  if ((isProtectedAppRoute || isProtectedApiRoute || isPortalProtectedRoute) && !user) {
    if (isProtectedApiRoute || pathname.startsWith("/api/portal/")) {
      return unauthenticatedApiResponse();
    }

    return redirectUnauthenticatedToLogin(request, pathname);
  }

  if (isPortalProtectedRoute && user && !isCustomerUser) {
    return redirectAuthenticatedToDashboard(request);
  }

  if (isProtectedAppRoute && user && isCustomerUser) {
    return redirectAuthenticatedToCustomerPortal(request);
  }

  if (isCustomerPortalAuthRoute(pathname) && user) {
    return isCustomerUser
      ? redirectAuthenticatedToCustomerPortal(request)
      : redirectAuthenticatedToDashboard(request);
  }

  if (isBusinessAuthRoute(pathname) && user && !isCustomerUser) {
    return redirectAuthenticatedToDashboard(request);
  }

  if (isBusinessAuthRoute(pathname) && user && isCustomerUser) {
    return redirectAuthenticatedToCustomerPortal(request);
  }

  if (
    isAuthRoute &&
    user &&
    !isCustomerPortalAuthRoute(pathname) &&
    !isBusinessAuthRoute(pathname)
  ) {
    return redirectAuthenticatedToDashboard(request);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
