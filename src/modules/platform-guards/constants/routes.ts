import { AUTH_ROUTES, PROTECTED_ROUTES, ROUTES } from "@/constants/routes";

export { AUTH_ROUTES, PROTECTED_ROUTES, ROUTES };

export const PLATFORM_DASHBOARD_PREFIX = "/dashboard" as const;
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
  "/api/auth/google",
  "/api/auth/callback",
] as const;
