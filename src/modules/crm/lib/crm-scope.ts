import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { CrmPlatformContext } from "@/modules/crm/types/customer";

export interface CrmTenantScope {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  userId: string;
}

/** Resolves multi-tenant CRM scope from platform business context. */
export function resolveCrmScope(platform: BusinessContext): CrmTenantScope {
  const businessId = platform.business.id;

  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId: platform.branchId,
    userId: platform.user.id,
  };
}

export function toCrmPlatformContext(scope: CrmTenantScope): CrmPlatformContext {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    userId: scope.userId,
  };
}

export function buildCrmScopeFromInput(input: {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId?: string | null;
  userId?: string;
}): CrmTenantScope {
  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId ?? null,
    userId: input.userId ?? "system",
  };
}
