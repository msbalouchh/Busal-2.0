"use server";

import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { getCurrentUser } from "@/services/auth.service";
import {
  completeBusinessSetup,
  finalizeWorkspaceSetup,
  getBusinessSetupProfile,
  isBusinessSetupCompleted,
  saveBusinessSetupDraft,
  updateBusinessSetupStep,
  type WorkspaceOnboardingFinalizeInput,
} from "@/services/business-setup.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { platformProvisioningService } from "@/modules/commercial-foundation/services/platform-provisioning.service";
import type { SubscriptionPlan } from "@/modules/business-onboarding/types/onboarding.types";
import { findActiveStaffByEmail } from "@/modules/staff-auth/services/staff-auth.service";
import {
  businessContactSchema,
  businessIdentitySchema,
  businessRegionSchema,
} from "@/modules/business-onboarding/schemas/business-setup.schema";
import type { BusinessType } from "@prisma/client";

function mapSubscriptionPlanToSlug(plan: SubscriptionPlan): string {
  if (plan === "trial") {
    return "starter";
  }

  return plan;
}

export async function provisionWorkspaceAction(input: {
  businessName: string;
  displayName: string;
  country: string;
  timezone: string;
  defaultBranchName: string;
  subscriptionPlan: SubscriptionPlan;
  businessEmail?: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const business = await getOrCreateBusinessForOwner(user.id);

  const businessName = input.displayName.trim() || input.businessName.trim();
  if (!businessName) {
    throw new Error("Business name is required");
  }

  const result = await platformProvisioningService.provisionExistingBusiness({
    businessId: business.id,
    ownerId: user.id,
    businessName,
    country: input.country,
    timezone: input.timezone,
    branchName: input.defaultBranchName,
    planSlug: mapSubscriptionPlanToSlug(input.subscriptionPlan),
    ownerEmail: input.businessEmail ?? user.email,
  });

  return { success: true as const, result };
}

export async function ensureBusinessSetupAccess() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const staff = await findActiveStaffByEmail(user.email);

  if (staff && staff.business.ownerId !== user.id) {
    redirect(ROUTES.application);
  }

  const completed = await isBusinessSetupCompleted(user.id);

  if (completed) {
    redirect(ROUTES.application);
  }

  await getOrCreateBusinessForOwner(user.id);
  const profile = await getBusinessSetupProfile(user.id);

  return { user, profile };
}

export async function saveBusinessIdentityAction(input: {
  businessName: string;
  businessType: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const parsed = businessIdentitySchema.parse(input);

  const profile = await saveBusinessSetupDraft(
    user.id,
    {
      businessName: parsed.businessName,
      businessType: parsed.businessType as BusinessType,
    },
    2,
  );

  return { success: true as const, profile };
}

export async function saveBusinessRegionAction(input: {
  industry: string;
  country: string;
  currency: string;
  timezone: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const parsed = businessRegionSchema.parse(input);

  const profile = await saveBusinessSetupDraft(user.id, parsed, 3);

  return { success: true as const, profile };
}

export async function saveBusinessContactAction(input: { phone: string; businessEmail: string }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const parsed = businessContactSchema.parse(input);

  const profile = await saveBusinessSetupDraft(user.id, parsed, 4);

  return { success: true as const, profile };
}

export async function finalizeWorkspaceOnboardingAction(input: WorkspaceOnboardingFinalizeInput) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  await getOrCreateBusinessForOwner(user.id);
  const profile = await finalizeWorkspaceSetup(user.id, input);

  return { success: true as const, profile };
}

export async function completeBusinessSetupAction() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const profile = await completeBusinessSetup(user.id);
  redirect(`${ROUTES.application}?welcome=1&code=${profile.businessCode ?? ""}`);
}

export async function goToBusinessSetupStepAction(step: number) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  await updateBusinessSetupStep(user.id, step);
  return { success: true as const, step };
}
