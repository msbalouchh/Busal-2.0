import "server-only";

import { analyticsService } from "@/modules/analytics/services/analytics.service";
import { toAnalyticsPlatformContext } from "@/modules/analytics/lib/analytics-scope";
import { jsonSuccess, withPlatformApiAuth } from "@/modules/platform/api/v1/platform-api-handler";
import { PLATFORM_API_SCOPES } from "@/modules/platform/constants/api-scopes";
import { resolveOrderScopeFromBusiness } from "@/modules/orders/lib/order-scope";

export async function handleV1GetAnalytics(request: Request) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.ANALYTICS_READ], async (auth) => {
    const scope = await resolveOrderScopeFromBusiness(auth.businessId);
    const context = toAnalyticsPlatformContext({
      tenantId: auth.businessId,
      workspaceId: auth.businessId,
      businessId: auth.businessId,
      branchId: scope.branchId,
      userId: "system",
      baseCurrency: "GBP",
    });

    const record = await analyticsService.getRecord(context);
    return jsonSuccess(record);
  });
}
