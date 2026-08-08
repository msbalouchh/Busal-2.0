import "server-only";

import { prisma } from "@/lib/prisma";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_PLAN_KEYS,
  type SubscriptionPlanKey,
} from "@/modules/finance/feature-access/constants/subscription-plans";
import type { PlatformModuleKey } from "@/modules/finance/feature-access/constants/feature-registry";

export interface TenantSubscriptionRecord {
  businessId: string;
  subscriptionPlan: string | null;
  subscriptionStatus: string;
  assignedFeatures: unknown;
}

function normalizePlanSlug(plan: string | null | undefined): SubscriptionPlanKey {
  const normalized = (plan ?? SUBSCRIPTION_PLAN_KEYS.STARTER).toLowerCase().replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "free_trial":
    case "trial":
      return SUBSCRIPTION_PLAN_KEYS.TRIAL;
    case "starter":
      return SUBSCRIPTION_PLAN_KEYS.STARTER;
    case "growth":
      return SUBSCRIPTION_PLAN_KEYS.GROWTH;
    case "professional":
    case "pro":
      return SUBSCRIPTION_PLAN_KEYS.PROFESSIONAL;
    case "enterprise":
      return SUBSCRIPTION_PLAN_KEYS.ENTERPRISE;
    case "custom_enterprise":
    case "custom":
      return SUBSCRIPTION_PLAN_KEYS.CUSTOM_ENTERPRISE;
    default:
      return SUBSCRIPTION_PLAN_KEYS.STARTER;
  }
}

function parseAssignedFeatures(raw: unknown): PlatformModuleKey[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((entry): entry is PlatformModuleKey => typeof entry === "string");
}

/** Loads tenant subscription state from Prisma. */
export class SubscriptionResolver {
  async resolve(businessId: string): Promise<TenantSubscriptionRecord | null> {
    const record = await prisma.tenantRecord.findUnique({
      where: { businessId },
      select: {
        businessId: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        assignedFeatures: true,
      },
    });

    if (!record) {
      return null;
    }

    return {
      businessId: record.businessId,
      subscriptionPlan: record.subscriptionPlan,
      subscriptionStatus: record.subscriptionStatus,
      assignedFeatures: record.assignedFeatures,
    };
  }

  normalizePlan(plan: string | null | undefined): SubscriptionPlanKey {
    return normalizePlanSlug(plan);
  }

  parseAssignedFeatures(raw: unknown): PlatformModuleKey[] {
    return parseAssignedFeatures(raw);
  }

  isSubscriptionActive(status: string): boolean {
    return ACTIVE_SUBSCRIPTION_STATUSES.has(status.toUpperCase());
  }
}

export const subscriptionResolver = new SubscriptionResolver();
