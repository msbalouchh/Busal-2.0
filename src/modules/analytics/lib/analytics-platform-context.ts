import type { AnalyticsPlatformContext } from "@/modules/analytics/types/analytics-platform";

export interface AnalyticsPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
  baseCurrency?: string;
}

export function buildAnalyticsPlatformContext(input: AnalyticsPlatformInput): AnalyticsPlatformContext {
  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId,
    userId: input.userId ?? "system",
    baseCurrency: input.baseCurrency ?? "GBP",
  };
}
