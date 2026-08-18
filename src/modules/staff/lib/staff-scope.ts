import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { StaffPlatformContext } from "@/modules/staff/types/staff-platform";

export interface StaffTenantScope {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
  actorStaffId: string | null;
}

export function resolveStaffScope(platform: BusinessContext): StaffTenantScope {
  const businessId = platform.business.id;
  const branchId = platform.branchId ?? platform.branch?.id;

  if (!branchId) {
    throw new Error("Branch context is required for staff operations");
  }

  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId,
    userId: platform.user.id,
    actorStaffId: platform.staffSession?.staffId ?? null,
  };
}

export function toStaffPlatformContext(scope: StaffTenantScope): StaffPlatformContext {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    userId: scope.userId,
  };
}

export async function resolveStaffScopeFromBusiness(
  businessId: string,
): Promise<StaffTenantScope> {
  const { resolveOrderScopeFromBusiness } = await import("@/modules/orders/lib/order-scope");
  const orderScope = await resolveOrderScopeFromBusiness(businessId);
  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId: orderScope.branchId,
    userId: "system",
    actorStaffId: null,
  };
}
