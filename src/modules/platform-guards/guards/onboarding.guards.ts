import "server-only";

import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { isOnboardingCompleted } from "@/services/business-profile.service";
import { requireAuthentication } from "@/modules/platform-guards/guards/authentication.guards";
import { mapToPlatformGuardError } from "@/modules/platform-guards/utils/error-mapper";
import { onboardingRequired } from "@/modules/platform-guards/utils/platform-guard-errors";

export async function requireOnboarding(): Promise<void> {
  const user = await requireAuthentication();
  const completed = await isOnboardingCompleted(user.id);

  if (!completed) {
    redirect(ROUTES.onboarding);
  }
}

export async function requireOnboardingForApi(): Promise<void> {
  try {
    const user = await requireAuthentication();
    const completed = await isOnboardingCompleted(user.id);

    if (!completed) {
      throw onboardingRequired();
    }
  } catch (error) {
    throw mapToPlatformGuardError(error);
  }
}

export async function requireOnboardingIncomplete(): Promise<void> {
  const user = await requireAuthentication();
  const completed = await isOnboardingCompleted(user.id);

  if (completed) {
    redirect(ROUTES.dashboard);
  }
}
