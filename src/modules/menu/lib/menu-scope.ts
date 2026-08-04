import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { MenuPlatformContext } from "@/modules/menu/types/menu";

export interface MenuTenantScope {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  userId: string;
}

export function resolveMenuScope(platform: BusinessContext): MenuTenantScope {
  const businessId = platform.business.id;

  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId: platform.branchId,
    userId: platform.user.id,
  };
}

export function toMenuPlatformContext(scope: MenuTenantScope): MenuPlatformContext {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId ?? scope.businessId,
    userId: scope.userId,
  };
}

export function buildMenuScopeFromInput(input: {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId?: string | null;
  userId?: string;
}): MenuTenantScope {
  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId ?? null,
    userId: input.userId ?? "system",
  };
}
