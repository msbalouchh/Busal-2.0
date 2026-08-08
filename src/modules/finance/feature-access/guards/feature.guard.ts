import "server-only";

import {
  FINANCE_MODULE_KEY,
  featurePermissionService,
} from "@/modules/finance/feature-access/services/feature-permission.service";
import type { PlatformModuleKey } from "@/modules/finance/feature-access/constants/feature-registry";
import type { ResolvedSubscription } from "@/modules/finance/feature-access/types/feature-access.types";
import type { PlatformContext } from "@/modules/platform-guards/types/platform-context";

export async function assertFeatureModuleAccess(
  businessId: string,
  moduleKey: PlatformModuleKey,
): Promise<ResolvedSubscription> {
  return featurePermissionService.assertModuleAccess(businessId, moduleKey);
}

export async function assertFinanceFeatureAccess(businessId: string): Promise<ResolvedSubscription> {
  return assertFeatureModuleAccess(businessId, FINANCE_MODULE_KEY);
}

export async function assertFinanceFeatureFromPlatform(
  platform: PlatformContext,
): Promise<ResolvedSubscription> {
  return assertFinanceFeatureAccess(platform.business.id);
}

export async function hasFinanceFeatureAccess(businessId: string): Promise<boolean> {
  return featurePermissionService.hasModuleAccess(businessId, FINANCE_MODULE_KEY);
}
