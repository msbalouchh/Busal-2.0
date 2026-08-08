import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { PosPlatformContext } from "@/modules/pos/types/pos-platform";

export interface PosTenantScope {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
  registerId: string;
  terminalId: string;
  shiftId: string;
}

export function resolvePosScope(platform: BusinessContext): PosTenantScope {
  const businessId = platform.business.id;
  const branchId = platform.branchId ?? platform.branch?.id;

  if (!branchId) {
    throw new Error("Branch context is required for POS operations");
  }

  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId,
    userId: platform.user.id,
    registerId: `${branchId}-register-main`,
    terminalId: `${branchId}-terminal-main`,
    shiftId: `${branchId}-shift-active`,
  };
}

export function toPosPlatformContext(scope: PosTenantScope): PosPlatformContext {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    userId: scope.userId,
    registerId: scope.registerId,
    terminalId: scope.terminalId,
    shiftId: scope.shiftId,
  };
}
