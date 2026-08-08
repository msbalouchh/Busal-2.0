import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { IntegrationPlatformContext } from "@/modules/integrations/types/integration-platform";

export interface IntegrationTenantScope {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
}

export function resolveIntegrationScope(platform: BusinessContext): IntegrationTenantScope {
  const businessId = platform.business.id;
  const branchId = platform.branchId ?? platform.branch?.id;

  if (!branchId) {
    throw new Error("Branch context is required for integration operations");
  }

  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId,
    userId: platform.user.id,
  };
}

export function toIntegrationPlatformContext(scope: IntegrationTenantScope): IntegrationPlatformContext {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    userId: scope.userId,
  };
}
