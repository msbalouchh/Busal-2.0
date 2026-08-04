import { FEATURE_LIMIT_KEYS, UNLIMITED_LIMIT } from "@/modules/billing/constants/feature-access";
import type {
  BillingAiFeatureKey,
  BillingModuleKey,
  FeatureLimitKey,
} from "@/modules/billing/constants/feature-access";
import type {
  FeatureLimits,
  PlanFeatureAccess,
  UsageRecord,
} from "@/modules/billing/types/billing-platform";
import {
  getLimitValue,
  isModuleEnabled,
  isAiFeatureEnabled,
  isWithinLimit,
} from "@/modules/billing/utils/feature-access-utils";

/** Service for evaluating subscription feature access and usage limits. */
export class FeatureAccessService {
  private featureAccess: PlanFeatureAccess;

  constructor(featureAccess: PlanFeatureAccess) {
    this.featureAccess = featureAccess;
  }

  getFeatureAccess(): PlanFeatureAccess {
    return structuredClone(this.featureAccess);
  }

  isModuleEnabled(moduleKey: BillingModuleKey): boolean {
    return isModuleEnabled(this.featureAccess, moduleKey);
  }

  isAiFeatureEnabled(featureKey: BillingAiFeatureKey): boolean {
    return isAiFeatureEnabled(this.featureAccess, featureKey);
  }

  getLimit(limitKey: FeatureLimitKey): number {
    return getLimitValue(this.featureAccess, limitKey);
  }

  isWithinLimit(limitKey: FeatureLimitKey, currentUsage: number): boolean {
    return isWithinLimit(this.featureAccess, limitKey, currentUsage);
  }

  getLimits(): FeatureLimits {
    return structuredClone(this.featureAccess.limits);
  }

  getUsageForLimit(usageRecords: UsageRecord[], limitKey: FeatureLimitKey): number {
    const record = usageRecords.find((r) => r.meterKey === limitKey);
    return record?.quantity ?? 0;
  }

  getUsageSummary(
    usageRecords: UsageRecord[],
  ): Array<{ limitKey: FeatureLimitKey; current: number; limit: number; isUnlimited: boolean }> {
    return Object.values(FEATURE_LIMIT_KEYS).map((limitKey) => {
      const limit = this.getLimit(limitKey);
      const current = this.getUsageForLimit(usageRecords, limitKey);
      return {
        limitKey,
        current,
        limit,
        isUnlimited: limit === UNLIMITED_LIMIT,
      };
    });
  }
}

export function createFeatureAccessService(featureAccess: PlanFeatureAccess): FeatureAccessService {
  return new FeatureAccessService(featureAccess);
}
