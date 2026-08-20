import "server-only";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { StaffAuthError } from "@/modules/staff-auth/utils/staff-auth-errors";
import { AuthServiceError } from "@/services/auth.service";

export type AuthInfrastructureErrorCategory =
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "DATABASE_CONFIGURATION_ERROR"
  | "DATABASE_CONNECTION_ERROR"
  | "SUPABASE_CONFIGURATION_ERROR"
  | "SUPABASE_AUTH_ERROR"
  | "UNEXPECTED_ERROR";

export function classifyAuthInfrastructureError(error: unknown): AuthInfrastructureErrorCategory {
  if (error instanceof AuthServiceError) {
    return error.code === "UNAUTHORIZED" ? "AUTHENTICATION_ERROR" : "SUPABASE_AUTH_ERROR";
  }

  if (error instanceof StaffAuthError) {
    return "AUTHORIZATION_ERROR";
  }

  if (!(error instanceof Error)) {
    return "UNEXPECTED_ERROR";
  }

  const message = error.message;

  if (message.includes("Missing Supabase environment variables")) {
    return "SUPABASE_CONFIGURATION_ERROR";
  }

  if (
    message.includes("Invalid server environment variables") ||
    message.includes("DATABASE_URL") ||
    message.includes("DIRECT_URL")
  ) {
    return "DATABASE_CONFIGURATION_ERROR";
  }

  if (message.includes("Can't reach database server") || message.includes("P1001")) {
    return "DATABASE_CONNECTION_ERROR";
  }

  if (message.includes("P1017")) {
    return "DATABASE_CONNECTION_ERROR";
  }

  return "UNEXPECTED_ERROR";
}

export function isInfrastructureError(error: unknown): boolean {
  const category = classifyAuthInfrastructureError(error);
  return (
    category === "DATABASE_CONFIGURATION_ERROR" ||
    category === "DATABASE_CONNECTION_ERROR" ||
    category === "SUPABASE_CONFIGURATION_ERROR"
  );
}

export function resolveAuthRouteErrorMessage(error: unknown): string {
  if (error instanceof AuthServiceError || error instanceof StaffAuthError) {
    return error.message;
  }

  switch (classifyAuthInfrastructureError(error)) {
    case "SUPABASE_CONFIGURATION_ERROR":
      return "Authentication is temporarily unavailable. Please try again shortly.";
    case "DATABASE_CONFIGURATION_ERROR":
    case "DATABASE_CONNECTION_ERROR":
      return "Authentication is temporarily unavailable. Please try again shortly.";
    default:
      return "Unable to complete authentication.";
  }
}

/** Validates Supabase public env without requiring database configuration. */
export function assertSupabaseConfigured(): void {
  getSupabaseEnv();
}
