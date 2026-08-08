import "server-only";

import {
  PLATFORM_MODULE_KEYS,
  PLATFORM_MODULE_LABELS,
  type PlatformModuleKey,
} from "@/modules/finance/feature-access/constants/feature-registry";
import {
  featureResolver,
  isModuleEnabled,
} from "@/modules/finance/feature-access/services/feature-resolver.service";
import type {
  FeatureAccessDeniedPayload,
  ResolvedSubscription,
} from "@/modules/finance/feature-access/types/feature-access.types";
import { permissionDenied } from "@/modules/platform-guards/utils/platform-guard-errors";

/** Evaluates module feature access for a business subscription. */
export class FeaturePermissionService {
  async getSubscription(businessId: string): Promise<ResolvedSubscription> {
    return featureResolver.resolveForBusiness(businessId);
  }

  async hasModuleAccess(businessId: string, moduleKey: PlatformModuleKey): Promise<boolean> {
    const subscription = await this.getSubscription(businessId);
    return isModuleEnabled(subscription, moduleKey);
  }

  async assertModuleAccess(businessId: string, moduleKey: PlatformModuleKey): Promise<ResolvedSubscription> {
    const subscription = await this.getSubscription(businessId);

    if (!isModuleEnabled(subscription, moduleKey)) {
      throw permissionDenied(this.buildDeniedMessage(moduleKey, subscription));
    }

    return subscription;
  }

  buildDeniedPayload(
    moduleKey: PlatformModuleKey,
    subscription: ResolvedSubscription,
  ): FeatureAccessDeniedPayload {
    return {
      code: "FEATURE_ACCESS_DENIED",
      moduleKey,
      plan: subscription.plan,
      message: this.buildDeniedMessage(moduleKey, subscription),
      upgradeRequired: true,
    };
  }

  private buildDeniedMessage(moduleKey: PlatformModuleKey, subscription: ResolvedSubscription): string {
    const label = PLATFORM_MODULE_LABELS[moduleKey];
    return `${label} is not included in your ${subscription.planLabel} plan. Upgrade required.`;
  }
}

export const featurePermissionService = new FeaturePermissionService();

export const FINANCE_MODULE_KEY = PLATFORM_MODULE_KEYS.FINANCE;
