export const APP_NAME = "Busal OS" as const;

export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  login: "/login",
  signup: "/signup",
} as const;

export const PROTECTED_ROUTES = [ROUTES.dashboard] as const;

export const AUTH_ROUTES = [ROUTES.login, ROUTES.signup] as const;

export const API_ROUTES = {
  health: "/api/health",
} as const;
