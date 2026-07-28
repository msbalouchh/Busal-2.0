import "server-only";

import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { getCurrentUser } from "@/services/auth.service";
import type { AuthUser } from "@/types/auth";

import { mapToPlatformGuardError } from "@/modules/platform-guards/utils/error-mapper";
import { unauthenticated } from "@/modules/platform-guards/utils/platform-guard-errors";

export async function requireAuthentication(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  return user;
}

export async function requireAuthenticationForApi(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw unauthenticated();
  }

  return user;
}

export async function requireAuthenticationForAction(): Promise<AuthUser> {
  return requireAuthenticationForApi();
}

export function assertAuthenticatedUser(user: AuthUser | null): asserts user is AuthUser {
  if (!user) {
    throw unauthenticated();
  }
}

export function handleAuthenticationFailure(error: unknown): never {
  throw mapToPlatformGuardError(error);
}
