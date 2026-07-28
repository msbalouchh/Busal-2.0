export const APP_NAME = "Busal OS" as const;

export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  onboarding: "/onboarding",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  authCallback: "/auth/callback",
} as const;

export const PROTECTED_ROUTES = [ROUTES.dashboard, ROUTES.onboarding] as const;

/** Routes that redirect authenticated users to the dashboard. */
export const AUTH_ROUTES = [ROUTES.login, ROUTES.signup, ROUTES.forgotPassword] as const;

/** Routes accessible without authentication (including password recovery). */
export const PUBLIC_ROUTES = [
  ROUTES.home,
  ROUTES.login,
  ROUTES.signup,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
  ROUTES.authCallback,
] as const;

export const API_ROUTES = {
  health: "/api/health",
  session: "/api/auth/session",
  login: "/api/auth/login",
  signup: "/api/auth/signup",
  logout: "/api/auth/logout",
  forgotPassword: "/api/auth/forgot-password",
  resetPassword: "/api/auth/reset-password",
  google: "/api/auth/google",
} as const;
