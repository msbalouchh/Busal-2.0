import type { AuthError } from "@supabase/supabase-js";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid email or password. Please try again.",
  email_not_confirmed: "Please confirm your email address before signing in.",
  user_already_registered: "An account with this email already exists.",
  weak_password: "Password is too weak. Please choose a stronger password.",
  over_request_rate_limit: "Too many attempts. Please wait a moment and try again.",
  same_password: "New password must be different from your current password.",
  session_expired: "Your session has expired. Please sign in again.",
};

export function getAuthErrorMessage(error: AuthError | Error | null): string {
  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }

  if ("code" in error && error.code && AUTH_ERROR_MESSAGES[error.code]) {
    return AUTH_ERROR_MESSAGES[error.code] ?? error.message;
  }

  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return AUTH_ERROR_MESSAGES.invalid_credentials ?? error.message;
  }

  if (message.includes("email not confirmed")) {
    return AUTH_ERROR_MESSAGES.email_not_confirmed ?? error.message;
  }

  if (message.includes("user already registered")) {
    return AUTH_ERROR_MESSAGES.user_already_registered ?? error.message;
  }

  if (message.includes("rate limit")) {
    return AUTH_ERROR_MESSAGES.over_request_rate_limit ?? error.message;
  }

  return error.message || "An unexpected error occurred. Please try again.";
}
