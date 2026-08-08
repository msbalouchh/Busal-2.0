import type { InventoryPlatformContext } from "@/modules/inventory/types/inventory-platform";

export interface InventoryPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
  defaultLocationId?: string;
}

export function buildInventoryPlatformContext(input: InventoryPlatformInput): InventoryPlatformContext {
  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId,
    userId: input.userId ?? "system",
    defaultLocationId: input.defaultLocationId ?? `${input.branchId}-loc-main`,
  };
}
