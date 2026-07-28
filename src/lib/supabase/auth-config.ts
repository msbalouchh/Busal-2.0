import { ROUTES } from "@/constants/routes";

/**
 * Supabase authentication configuration.
 * OAuth redirect URLs must also be allowlisted in the Supabase dashboard.
 */
export const SUPABASE_AUTH_CONFIG = {
  /** PKCE flow is handled automatically by @supabase/ssr. */
  flowType: "pkce" as const,
  oauth: {
    google: {
      provider: "google" as const,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  },
  redirects: {
    callback: ROUTES.authCallback,
    defaultSuccess: ROUTES.dashboard,
    passwordResetNext: ROUTES.resetPassword,
  },
} as const;
