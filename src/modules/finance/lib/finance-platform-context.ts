import type { FinancePlatformContext } from "@/modules/finance/types/finance-platform";

export interface FinancePlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
  currentPeriodId?: string;
  baseCurrency?: string;
}

export function buildFinancePlatformContext(input: FinancePlatformInput): FinancePlatformContext {
  const now = new Date();
  const defaultPeriodId = `period-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId,
    userId: input.userId ?? "system",
    currentPeriodId: input.currentPeriodId ?? defaultPeriodId,
    baseCurrency: input.baseCurrency ?? "GBP",
  };
}
