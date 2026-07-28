"use server";

import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import {
  completeOnboarding,
  finalizeOnboardingAtCurrentStep,
  getOrCreateBusinessForOwner,
  updateBusinessAiPersonality,
  updateBusinessGoal,
  updateBusinessInterview,
  updateBusinessMeetYourAi,
  updateOnboardingStep,
} from "@/services/business-profile.service";

import {
  ONBOARDING_TOTAL_STEPS,
  clampOnboardingStep,
} from "@/modules/onboarding/config/onboarding-steps";
import { isAiPersonalityValue } from "@/modules/onboarding/lib/ai-personalities";
import { isBusinessTypeValue } from "@/modules/onboarding/lib/business-interview-questions";
import { isBusinessGoalValue } from "@/modules/onboarding/lib/business-goals";
import { requireAuthenticatedUser } from "@/modules/onboarding/lib/onboarding-guard";
import type { BusinessInterviewUpdateInput } from "@/services/business-profile.service";

export async function advanceOnboardingStepAction() {
  const user = await requireAuthenticatedUser();
  const business = await getOrCreateBusinessForOwner(user.id);
  const currentStep = clampOnboardingStep(business.onboardingStep);

  if (currentStep >= ONBOARDING_TOTAL_STEPS) {
    await completeOnboarding(user.id);
    redirect(ROUTES.dashboard);
  }

  const nextStep = currentStep + 1;
  await updateOnboardingStep(user.id, nextStep);

  return { success: true as const, step: nextStep };
}

export async function completeOnboardingAction() {
  const user = await requireAuthenticatedUser();
  await completeOnboarding(user.id);
  redirect(ROUTES.dashboard);
}

export async function saveMeetYourAiAction(input: { ownerName?: string; aiName: string }) {
  const user = await requireAuthenticatedUser();

  await updateBusinessMeetYourAi(user.id, {
    ownerName: input.ownerName,
    aiName: input.aiName,
  });

  return { success: true as const };
}

export async function saveAiPersonalityAction(input: { aiPersonality: string }) {
  const user = await requireAuthenticatedUser();

  if (!isAiPersonalityValue(input.aiPersonality)) {
    throw new Error("Invalid AI personality selection");
  }

  await updateBusinessAiPersonality(user.id, input.aiPersonality);

  return { success: true as const };
}

export async function saveBusinessInterviewAction(input: BusinessInterviewUpdateInput) {
  const user = await requireAuthenticatedUser();

  if (input.businessType !== undefined && !isBusinessTypeValue(input.businessType)) {
    throw new Error("Invalid business type selection");
  }

  await updateBusinessInterview(user.id, input);

  return { success: true as const };
}

export async function saveBusinessGoalAction(input: { businessGoal: string }) {
  const user = await requireAuthenticatedUser();

  if (!isBusinessGoalValue(input.businessGoal)) {
    throw new Error("Invalid business goal selection");
  }

  await updateBusinessGoal(user.id, input.businessGoal);

  return { success: true as const };
}

export async function finalizePreparingWorkspaceAction() {
  const user = await requireAuthenticatedUser();

  await finalizeOnboardingAtCurrentStep(user.id);

  redirect(ROUTES.dashboard);
}
