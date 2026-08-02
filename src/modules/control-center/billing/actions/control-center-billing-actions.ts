"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { CONTROL_CENTER_BILLING_ROUTES } from "@/modules/control-center/billing/constants/control-center-billing";
import type {
  AssignSubscriptionPlanInput,
  ControlCenterSubscriptionDirectoryQuery,
  UpsertPromotionInput,
  UpsertSubscriptionPlanInput,
} from "@/modules/control-center/billing/types/control-center-billing-types";
import {
  queryControlCenterSubscriptions,
  runControlCenterArchivePlan,
  runControlCenterAssignSubscription,
  runControlCenterDuplicatePlan,
  runControlCenterSubscriptionStatusChange,
  runControlCenterUpsertPlan,
  runControlCenterUpsertPromotion,
} from "@/services/control-center-billing.service";

function revalidateBillingPages(businessId?: string) {
  revalidatePath(CONTROL_CENTER_BILLING_ROUTES.overview);
  if (businessId) {
    revalidatePath(CONTROL_CENTER_BILLING_ROUTES.detail(businessId));
  }
}

export async function queryControlCenterSubscriptionsAction(
  query: ControlCenterSubscriptionDirectoryQuery,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SUBSCRIPTIONS, async () =>
    queryControlCenterSubscriptions(query),
  );
}

export async function assignControlCenterSubscriptionAction(input: AssignSubscriptionPlanInput) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUBSCRIPTIONS,
    async ({ operator }) => {
      await runControlCenterAssignSubscription(operator, input);
      revalidateBillingPages(input.businessId);
    },
  );
}

export async function upgradeControlCenterSubscriptionAction(
  businessId: string,
  subscriptionPlan: string,
) {
  return assignControlCenterSubscriptionAction({
    businessId,
    subscriptionPlan,
    subscriptionStatus: "ACTIVE",
  });
}

export async function downgradeControlCenterSubscriptionAction(
  businessId: string,
  subscriptionPlan: string,
) {
  return assignControlCenterSubscriptionAction({
    businessId,
    subscriptionPlan,
    subscriptionStatus: "ACTIVE",
  });
}

export async function cancelControlCenterSubscriptionAction(businessId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUBSCRIPTIONS,
    async ({ operator }) => {
      await runControlCenterSubscriptionStatusChange(operator, businessId, "CANCELLED");
      revalidateBillingPages(businessId);
    },
  );
}

export async function pauseControlCenterSubscriptionAction(businessId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUBSCRIPTIONS,
    async ({ operator }) => {
      await runControlCenterSubscriptionStatusChange(operator, businessId, "PAUSED");
      revalidateBillingPages(businessId);
    },
  );
}

export async function resumeControlCenterSubscriptionAction(businessId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUBSCRIPTIONS,
    async ({ operator }) => {
      await runControlCenterSubscriptionStatusChange(operator, businessId, "ACTIVE");
      revalidateBillingPages(businessId);
    },
  );
}

export async function upsertControlCenterPlanAction(input: UpsertSubscriptionPlanInput) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_BILLING_PLANS,
    async ({ operator }) => {
      const plan = await runControlCenterUpsertPlan(operator, input);
      revalidateBillingPages();
      return plan;
    },
  );
}

export async function archiveControlCenterPlanAction(slug: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_BILLING_PLANS,
    async ({ operator }) => {
      const plan = await runControlCenterArchivePlan(operator, slug);
      revalidateBillingPages();
      return plan;
    },
  );
}

export async function duplicateControlCenterPlanAction(slug: string, newSlug: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_BILLING_PLANS,
    async ({ operator }) => {
      const plan = await runControlCenterDuplicatePlan(operator, slug, newSlug);
      revalidateBillingPages();
      return plan;
    },
  );
}

export async function upsertControlCenterPromotionAction(input: UpsertPromotionInput) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_BILLING_PROMOTIONS,
    async ({ operator }) => {
      const promotion = await runControlCenterUpsertPromotion(operator, input);
      revalidateBillingPages();
      return promotion;
    },
  );
}
