import {
  AUTH_ROUTES,
  CUSTOMER_PORTAL_PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  ROUTES,
} from "@/constants/routes";

export { AUTH_ROUTES, CUSTOMER_PORTAL_PUBLIC_ROUTES, PROTECTED_ROUTES, ROUTES };

export const CUSTOMER_PORTAL_PREFIX = ROUTES.customerPortal;

export const PLATFORM_DASHBOARD_PREFIX = "/dashboard" as const;
export const PLATFORM_CONTROL_CENTER_PREFIX = "/control-center" as const;
export const PLATFORM_API_PREFIX = "/api" as const;

/** API routes that require a Supabase session at the edge. */
export const PLATFORM_PROTECTED_API_ROUTES = ["/api/auth/session"] as const;

/** API routes that remain public even under /api. */
export const PLATFORM_PUBLIC_API_ROUTES = [
  "/api/health",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/resend-verification",
  "/api/auth/google",
  "/api/portal/auth/login",
  "/api/portal/auth/register",
] as const;
