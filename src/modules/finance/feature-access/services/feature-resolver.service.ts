import "server-only";

import {
  SUBSCRIPTION_PLAN_KEYS,
  type SubscriptionPlanKey,
} from "@/modules/finance/feature-access/constants/subscription-plans";
import type { PlatformModuleKey } from "@/modules/finance/feature-access/constants/feature-registry";
import { planResolver } from "@/modules/finance/feature-access/services/plan-resolver.service";
import {
  subscriptionResolver,
  type TenantSubscriptionRecord,
} from "@/modules/finance/feature-access/services/subscription-resolver.service";
import type { ResolvedSubscription } from "@/modules/finance/feature-access/types/feature-access.types";

/** Combines subscription record + plan entitlements into enabled modules. */
export class FeatureResolver {
  resolveFromRecord(record: TenantSubscriptionRecord): ResolvedSubscription {
    const plan = subscriptionResolver.normalizePlan(record.subscriptionPlan);
    const assignedFeatures = subscriptionResolver.parseAssignedFeatures(record.assignedFeatures);
    const planModules = planResolver.resolveModules(plan);
    const enabledModules = planResolver.mergeCustomModules(plan, planModules, assignedFeatures);

    let source: ResolvedSubscription["source"] = "plan";
    if (plan === SUBSCRIPTION_PLAN_KEYS.CUSTOM_ENTERPRISE) {
      source = "custom";
    } else if (
      plan === SUBSCRIPTION_PLAN_KEYS.ENTERPRISE &&
      assignedFeatures.length > 0
    ) {
      source = "custom";
    }

    return {
      businessId: record.businessId,
      plan,
      planLabel: planResolver.resolveLabel(plan),
      status: record.subscriptionStatus,
      isActive: subscriptionResolver.isSubscriptionActive(record.subscriptionStatus),
      assignedFeatures,
      enabledModules,
      source,
    };
  }

  async resolveForBusiness(businessId: string): Promise<ResolvedSubscription> {
    const record = await subscriptionResolver.resolve(businessId);

    if (!record) {
      return {
        businessId,
        plan: SUBSCRIPTION_PLAN_KEYS.STARTER,
        planLabel: planResolver.resolveLabel(SUBSCRIPTION_PLAN_KEYS.STARTER),
        status: "INACTIVE",
        isActive: false,
        assignedFeatures: [],
        enabledModules: [],
        source: "plan",
      };
    }

    return this.resolveFromRecord(record);
  }
}

export const featureResolver = new FeatureResolver();

export function isModuleEnabled(
  subscription: ResolvedSubscription,
  moduleKey: PlatformModuleKey,
): boolean {
  if (!subscription.isActive) {
    return false;
  }

  return subscription.enabledModules.includes(moduleKey);
}
