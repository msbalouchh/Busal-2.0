"use server";

import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { runSafeServerAction } from "@/lib/safe-server-action";
import { getCurrentUser } from "@/services/auth.service";
import {
  completeBusinessSetup,
  finalizeWorkspaceSetup,
  getBusinessSetupProfile,
  isBusinessSetupCompleted,
  loadWorkspaceWizardDraft,
  saveBusinessSetupDraft,
  saveWorkspaceWizardDraft,
  updateBusinessSetupStep,
  type WorkspaceOnboardingFinalizeInput,
} from "@/services/business-setup.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { buildAppUrl } from "@/config/app-url";
import { isStripeConfigured } from "@/lib/stripe";
import { stripeBillingService } from "@/modules/commercial-foundation/services/stripe-billing.service";
import {
  assertCheckoutEligiblePlanSlug,
  canUseDevelopmentBillingFallback,
  isEnterprisePlanSlug,
  requireStripeBillingForActivation,
} from "@/modules/commercial-foundation/services/stripe-billing-config.service";
import { platformProvisioningService } from "@/modules/commercial-foundation/services/platform-provisioning.service";
import { resolveSubscriptionAccess } from "@/modules/commercial-foundation/services/subscription-access.service";
import { subscriptionLifecycleService } from "@/modules/commercial-foundation/services/subscription-lifecycle.service";
import type { SubscriptionPlan } from "@/modules/business-onboarding/types/onboarding.types";
import {
  BUSAL_COMMERCIAL_PLAN_SLUGS,
  getSubscriptionPlanBySlug,
} from "@/modules/control-center/billing/registry/subscription-plan-registry";
import { findActiveStaffByEmail } from "@/modules/staff-auth/services/staff-auth.service";
import {
  businessContactSchema,
  businessIdentitySchema,
  businessRegionSchema,
} from "@/modules/business-onboarding/schemas/business-setup.schema";
import type { BusinessType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function mapSubscriptionPlanToSlug(plan: SubscriptionPlan): string {
  if (plan === "trial") {
    return BUSAL_COMMERCIAL_PLAN_SLUGS.CORE;
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
  return runSafeServerAction("provisionWorkspaceAction", async () => {
    const user = await getCurrentUser();

    if (!user) {
      redirect(ROUTES.login);
    }

    const business = await getOrCreateBusinessForOwner(user.id, {
      email: user.email,
      fullName: user.fullName,
    });

    const businessName = input.displayName.trim() || input.businessName.trim();
    if (!businessName) {
      throw new Error("Business name is required");
    }

    const planSlug = mapSubscriptionPlanToSlug(input.subscriptionPlan);
    const selectedPlan =
      getSubscriptionPlanBySlug(planSlug) ??
      getSubscriptionPlanBySlug(BUSAL_COMMERCIAL_PLAN_SLUGS.CORE);

    if (!selectedPlan) {
      throw new Error("Selected plan is not configured");
    }

    if (isEnterprisePlanSlug(selectedPlan.slug)) {
      throw new Error("Enterprise plans require custom billing. Contact Busal sales to continue.");
    }

    assertCheckoutEligiblePlanSlug(selectedPlan.slug);

    const mustUseStripe = isStripeConfigured() || !canUseDevelopmentBillingFallback();

    if (mustUseStripe) {
      requireStripeBillingForActivation();
    }

    const result = await platformProvisioningService.provisionExistingBusiness({
      businessId: business.id,
      ownerId: user.id,
      businessName,
      country: input.country,
      timezone: input.timezone,
      branchName: input.defaultBranchName,
      planSlug: selectedPlan.slug,
      ownerEmail: input.businessEmail ?? user.email,
      deferSubscriptionActivation: mustUseStripe,
    });

    if (mustUseStripe) {
      const checkout = await stripeBillingService.createCheckoutSession({
        businessId: business.id,
        planId: selectedPlan.id,
        billingCycle: "monthly",
        successUrl: buildAppUrl(`${ROUTES.businessOnboarding}?step=11&checkout=success`),
        cancelUrl: buildAppUrl(`${ROUTES.businessOnboarding}?step=9&checkout=cancelled`),
        customerEmail: input.businessEmail ?? user.email,
        requirePaymentMethod: true,
      });

      if (!checkout.url) {
        throw new Error("Unable to start billing checkout");
      }

      return { success: true as const, result, checkoutUrl: checkout.url };
    }

    if (input.subscriptionPlan === "trial") {
      await subscriptionLifecycleService.startTrial(business.id, selectedPlan.id);
    } else {
      await subscriptionLifecycleService.assignPlan(business.id, selectedPlan.slug);
    }

    return { success: true as const, result };
  });
}

export async function ensureBusinessSetupAccess() {
  return runSafeServerAction("ensureBusinessSetupAccess", async () => {
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

    await getOrCreateBusinessForOwner(user.id, {
      email: user.email,
      fullName: user.fullName,
    });
    const profile = await getBusinessSetupProfile(user.id);

    return { user, profile };
  });
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

export async function confirmBillingActivationAction() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const business = await getOrCreateBusinessForOwner(user.id);

  if (isStripeConfigured() || !canUseDevelopmentBillingFallback()) {
    const synced = await stripeBillingService.syncFromLatestCheckoutSession(business.id);
    const access =
      await import("@/modules/commercial-foundation/services/subscription-access.service").then(
        (module) => module.resolveSubscriptionAccess(business.id),
      );

    if (!access.allowed) {
      throw new Error("Billing activation is required before entering the dashboard.");
    }

    return { success: true as const, synced };
  }

  const access =
    await import("@/modules/commercial-foundation/services/subscription-access.service").then(
      (module) => module.resolveSubscriptionAccess(business.id),
    );

  if (!access.allowed) {
    throw new Error("Billing activation is required before entering the dashboard.");
  }

  return { success: true as const, synced: false };
}

export async function saveWorkspaceWizardProgressAction(input: {
  step: number;
  data: Record<string, unknown>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  await getOrCreateBusinessForOwner(user.id);
  const profile = await saveWorkspaceWizardDraft(user.id, input.step, input.data);

  return { success: true as const, profile };
}

export async function loadWorkspaceWizardDraftAction() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  await getOrCreateBusinessForOwner(user.id);
  return loadWorkspaceWizardDraft(user.id);
}

export async function resolvePostCheckoutOnboardingAction() {
  return runSafeServerAction("resolvePostCheckoutOnboardingAction", async () => {
    const user = await getCurrentUser();

    if (!user) {
      redirect(ROUTES.login);
    }

    const business = await getOrCreateBusinessForOwner(user.id, {
      email: user.email,
      fullName: user.fullName,
    });
    const tenant = await prisma.tenantRecord.findUnique({
      where: { businessId: business.id },
      select: { id: true },
    });

    if (isStripeConfigured() || !canUseDevelopmentBillingFallback()) {
      await stripeBillingService.syncFromLatestCheckoutSession(business.id);
    }

    const access = await resolveSubscriptionAccess(business.id);

    if (access.allowed) {
      return {
        skipProvisioning: true as const,
        redirectToStep: 11 as const,
        billingActive: true as const,
      };
    }

    if (tenant) {
      return {
        skipProvisioning: true as const,
        redirectToStep: 11 as const,
        billingActive: false as const,
      };
    }

    return { skipProvisioning: false as const };
  });
}
