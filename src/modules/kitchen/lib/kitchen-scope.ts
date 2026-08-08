import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { KitchenPlatformContext } from "@/modules/kitchen/types/kitchen";

export interface KitchenTenantScope {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
  kitchenId: string;
}

export function resolveKitchenScope(platform: BusinessContext): KitchenTenantScope {
  const businessId = platform.business.id;
  const branchId = platform.branchId ?? platform.branch?.id;

  if (!branchId) {
    throw new Error("Branch context is required for kitchen operations");
  }

  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId,
    userId: platform.user.id,
    kitchenId: `${branchId}-kitchen`,
  };
}

export function toKitchenPlatformContext(scope: KitchenTenantScope): KitchenPlatformContext {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    userId: scope.userId,
    kitchenId: scope.kitchenId,
  };
}

export function buildKitchenScopeFromInput(input: {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
  kitchenId?: string;
}): KitchenTenantScope {
  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId,
    userId: input.userId ?? "system",
    kitchenId: input.kitchenId ?? `${input.branchId}-kitchen`,
  };
}
