import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { InventoryPlatformContext } from "@/modules/inventory/types/inventory-platform";

export interface InventoryTenantScope {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
  defaultLocationId: string;
}

export function resolveInventoryScope(platform: BusinessContext): InventoryTenantScope {
  const businessId = platform.business.id;
  const branchId = platform.branchId ?? platform.branch?.id;

  if (!branchId) {
    throw new Error("Branch context is required for inventory operations");
  }

  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId,
    userId: platform.user.id,
    defaultLocationId: `${branchId}-loc-main`,
  };
}

export function toInventoryPlatformContext(scope: InventoryTenantScope): InventoryPlatformContext {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    userId: scope.userId,
    defaultLocationId: scope.defaultLocationId,
  };
}

export async function resolveInventoryScopeFromBusiness(
  businessId: string,
): Promise<InventoryTenantScope> {
  const { resolveOrderScopeFromBusiness } = await import("@/modules/orders/lib/order-scope");
  const orderScope = await resolveOrderScopeFromBusiness(businessId);
  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId: orderScope.branchId,
    userId: "system",
    defaultLocationId: `${orderScope.branchId}-loc-main`,
  };
}
