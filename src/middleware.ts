import { type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/middleware";
import {
  isPlatformAuthRoute,
  isPlatformProtectedApiRoute,
  isPlatformProtectedAppRoute,
  redirectAuthenticatedToDashboard,
  redirectUnauthenticatedToLogin,
  unauthenticatedApiResponse,
} from "@/modules/platform-guards/middleware/platform-guards-middleware";

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);
  const pathname = request.nextUrl.pathname;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedAppRoute = isPlatformProtectedAppRoute(pathname);
  const isProtectedApiRoute = isPlatformProtectedApiRoute(pathname);
  const isAuthRoute = isPlatformAuthRoute(pathname);

  if ((isProtectedAppRoute || isProtectedApiRoute) && !user) {
    if (isProtectedApiRoute) {
      return unauthenticatedApiResponse();
    }

    return redirectUnauthenticatedToLogin(request, pathname);
  }

  if (isAuthRoute && user) {
    return redirectAuthenticatedToDashboard(request);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
