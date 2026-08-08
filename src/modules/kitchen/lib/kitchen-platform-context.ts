import type { KitchenPlatformContext } from "@/modules/kitchen/types/kitchen";

export interface KitchenPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
  kitchenId?: string;
}

export function buildKitchenPlatformContext(input: KitchenPlatformInput): KitchenPlatformContext {
  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId,
    userId: input.userId ?? "system",
    kitchenId: input.kitchenId ?? `${input.branchId}-kitchen`,
  };
}
