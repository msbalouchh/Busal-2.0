import "server-only";

import {
  featurePermissionService,
  isModuleEnabled,
  type PlatformModuleKey,
  type ResolvedSubscription,
} from "@/modules/feature-access";
import type { PlatformContext } from "@/modules/platform-guards/types/platform-context";

export async function assertPlatformModuleAccess(
  businessId: string,
  moduleKey: PlatformModuleKey,
): Promise<ResolvedSubscription> {
  return featurePermissionService.assertModuleAccess(businessId, moduleKey);
}

export async function assertPlatformModuleFromContext(
  platform: PlatformContext,
  moduleKey: PlatformModuleKey,
): Promise<ResolvedSubscription> {
  return assertPlatformModuleAccess(platform.business.id, moduleKey);
}

export async function hasPlatformModuleAccess(
  businessId: string,
  moduleKey: PlatformModuleKey,
): Promise<boolean> {
  return featurePermissionService.hasModuleAccess(businessId, moduleKey);
}

export function filterNavigationByEntitlements<T extends { id: string; href?: string }>(
  items: T[],
  subscription: ResolvedSubscription,
  moduleKeyById: Record<string, PlatformModuleKey>,
): T[] {
  return items.filter((item) => {
    const moduleKey = moduleKeyById[item.id];
    if (!moduleKey) {
      return true;
    }
    return isModuleEnabled(subscription, moduleKey);
  });
}
