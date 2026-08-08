import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { AnalyticsPlatformContext } from "@/modules/analytics/types/analytics-platform";

export interface AnalyticsTenantScope {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
  baseCurrency: string;
}

export function resolveAnalyticsScope(platform: BusinessContext): AnalyticsTenantScope {
  const businessId = platform.business.id;
  const branchId = platform.branchId ?? platform.branch?.id;

  if (!branchId) {
    throw new Error("Branch context is required for analytics operations");
  }

  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId,
    userId: platform.user.id,
    baseCurrency: "GBP",
  };
}

export function toAnalyticsPlatformContext(scope: AnalyticsTenantScope): AnalyticsPlatformContext {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    userId: scope.userId,
    baseCurrency: scope.baseCurrency,
  };
}
