import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { TablePlatformContext } from "@/modules/table-management/types/table-management";

export interface TableTenantScope {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
}

export function resolveTableScope(platform: BusinessContext): TableTenantScope {
  const businessId = platform.business.id;
  const branchId = platform.branchId ?? platform.branch?.id;

  if (!branchId) {
    throw new Error("Branch context is required for table management");
  }

  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId,
    userId: platform.user.id,
  };
}

export function toTablePlatformContext(scope: TableTenantScope): TablePlatformContext {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    userId: scope.userId,
  };
}

export function buildTableScopeFromInput(input: {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
}): TableTenantScope {
  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId,
    userId: input.userId ?? "system",
  };
}
