import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { OrchestrationTenantScope } from "@/modules/platform-orchestration/types/domain-event.types";

export function resolveOrchestrationScope(platform: BusinessContext): OrchestrationTenantScope {
  const businessId = platform.business.id;
  const branchId = platform.branchId ?? platform.branch?.id;

  if (!branchId) {
    throw new Error("Branch context is required for orchestration operations");
  }

  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId,
    userId: platform.user.id,
  };
}

export function assertOrchestrationScope(scope: Partial<OrchestrationTenantScope>): OrchestrationTenantScope {
  const { tenantId, workspaceId, businessId, branchId, userId } = scope;

  if (!tenantId || !workspaceId || !businessId || !branchId || !userId) {
    throw new Error("Full tenant scope is required for domain events");
  }

  return { tenantId, workspaceId, businessId, branchId, userId };
}
