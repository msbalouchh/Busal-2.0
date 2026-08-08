import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { FinancePlatformContext } from "@/modules/finance/types/finance-platform";

export interface FinanceTenantScope {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
  baseCurrency: string;
  currentPeriodId: string;
}

export function resolveFinanceScope(platform: BusinessContext): FinanceTenantScope {
  const businessId = platform.business.id;
  const branchId = platform.branchId ?? platform.branch?.id;

  if (!branchId) {
    throw new Error("Branch context is required for finance operations");
  }

  const now = new Date();
  const periodId = `period-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return {
    tenantId: businessId,
    workspaceId: businessId,
    businessId,
    branchId,
    userId: platform.user.id,
    baseCurrency: "GBP",
    currentPeriodId: periodId,
  };
}

export function toFinancePlatformContext(scope: FinanceTenantScope): FinancePlatformContext {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    userId: scope.userId,
    currentPeriodId: scope.currentPeriodId,
    baseCurrency: scope.baseCurrency,
  };
}
