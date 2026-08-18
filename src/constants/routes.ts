export const APP_NAME = "Busal OS" as const;

export const ROUTES = {
  home: "/",
  application: "/app",
  dashboard: "/dashboard",
  dashboardBilling: "/dashboard/billing",
  controlCenter: "/control-center",
  onboarding: "/onboarding",
  businessOnboarding: "/business-onboarding",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  authCallback: "/auth/callback",
  authContinue: "/auth/continue",
  customerPortal: "/portal",
  customerPortalLogin: "/portal/login",
  customerPortalRegister: "/portal/register",
} as const;

export const PROTECTED_ROUTES = [
  ROUTES.application,
  ROUTES.dashboard,
  ROUTES.controlCenter,
  ROUTES.onboarding,
  ROUTES.businessOnboarding,
] as const;

/** Routes that redirect authenticated users to the application shell. */
export const AUTH_ROUTES = [
  ROUTES.login,
  ROUTES.signup,
  ROUTES.forgotPassword,
  ROUTES.customerPortalLogin,
  ROUTES.customerPortalRegister,
] as const;

export const CUSTOMER_PORTAL_PROTECTED_PREFIX = ROUTES.customerPortal;

export const CUSTOMER_PORTAL_PUBLIC_ROUTES = [
  ROUTES.customerPortalLogin,
  ROUTES.customerPortalRegister,
] as const;

/** Routes accessible without authentication (including password recovery). */
export const PUBLIC_ROUTES = [
  ROUTES.home,
  ROUTES.login,
  ROUTES.signup,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
  ROUTES.verifyEmail,
  ROUTES.authCallback,
  ROUTES.authContinue,
  "/platform",
  "/ai",
  "/industries",
  "/features",
  "/pricing",
  "/customer-success",
  "/why-busal",
  "/about",
  "/resources",
  "/blog",
  "/help",
  "/faq",
  "/contact",
  "/book-demo",
  "/partners",
  "/careers",
  "/privacy",
  "/terms",
] as const;

/** Routes accessible to authenticated users pending email verification. */
export const EMAIL_VERIFICATION_PENDING_ROUTES = [
  ROUTES.verifyEmail,
  ROUTES.authCallback,
  ROUTES.authContinue,
] as const;

export const API_ROUTES = {
  health: "/api/health",
  session: "/api/auth/session",
  login: "/api/auth/login",
  signup: "/api/auth/signup",
  logout: "/api/auth/logout",
  forgotPassword: "/api/auth/forgot-password",
  resetPassword: "/api/auth/reset-password",
  resendVerification: "/api/auth/resend-verification",
  google: "/api/auth/google",
} as const;
