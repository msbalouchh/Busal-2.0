import {
  ALL_PLATFORM_MODULE_KEYS,
  type PlatformModuleKey,
} from "@/modules/finance/feature-access/constants/feature-registry";
import {
  PLAN_MODULE_ENTITLEMENTS,
  SUBSCRIPTION_PLAN_KEYS,
  SUBSCRIPTION_PLAN_LABELS,
  type SubscriptionPlanKey,
} from "@/modules/finance/feature-access/constants/subscription-plans";

/** Resolves plan slug to default module entitlements. */
export class PlanResolver {
  resolveModules(plan: SubscriptionPlanKey): PlatformModuleKey[] {
    return [...PLAN_MODULE_ENTITLEMENTS[plan]];
  }

  resolveLabel(plan: SubscriptionPlanKey): string {
    return SUBSCRIPTION_PLAN_LABELS[plan];
  }

  isCustomPlan(plan: SubscriptionPlanKey): boolean {
    return plan === SUBSCRIPTION_PLAN_KEYS.CUSTOM_ENTERPRISE;
  }

  isEnterprisePlan(plan: SubscriptionPlanKey): boolean {
    return plan === SUBSCRIPTION_PLAN_KEYS.ENTERPRISE;
  }

  mergeCustomModules(
    plan: SubscriptionPlanKey,
    planModules: PlatformModuleKey[],
    assignedFeatures: PlatformModuleKey[],
  ): PlatformModuleKey[] {
    if (this.isCustomPlan(plan)) {
      return assignedFeatures.length > 0 ? assignedFeatures : planModules;
    }

    if (this.isEnterprisePlan(plan) && assignedFeatures.length > 0) {
      return assignedFeatures;
    }

    if (this.isEnterprisePlan(plan)) {
      return ALL_PLATFORM_MODULE_KEYS;
    }

    return planModules;
  }
}

export const planResolver = new PlanResolver();
