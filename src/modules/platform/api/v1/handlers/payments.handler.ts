import "server-only";

import { financeService } from "@/modules/finance/services/finance.service";
import { toFinancePlatformContext } from "@/modules/finance/lib/finance-scope";
import { jsonSuccess, withPlatformApiAuth } from "@/modules/platform/api/v1/platform-api-handler";
import { PLATFORM_API_SCOPES } from "@/modules/platform/constants/api-scopes";
import { resolveOrderScopeFromBusiness } from "@/modules/orders/lib/order-scope";

export async function handleV1ListPayments(request: Request) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.BUSINESS_READ], async (auth) => {
    const scope = await resolveOrderScopeFromBusiness(auth.businessId);
    const now = new Date();
    const context = toFinancePlatformContext({
      tenantId: auth.businessId,
      workspaceId: auth.businessId,
      businessId: auth.businessId,
      branchId: scope.branchId,
      userId: "system",
      baseCurrency: "GBP",
      currentPeriodId: `period-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    });

    const record = await financeService.getRecord(context);
    return jsonSuccess({ payments: record.payments, invoices: record.invoices });
  });
}
