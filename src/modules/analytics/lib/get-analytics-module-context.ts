import { cache } from "react";

import { ANALYTICS_MODULE_PERMISSIONS } from "@/modules/analytics/constants/permissions";
import { resolveAnalyticsScope, toAnalyticsPlatformContext } from "@/modules/analytics/lib/analytics-scope";
import { buildAnalyticsPlatformSnapshot } from "@/modules/analytics/services/analytics-platform.service";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";

export const getAnalyticsPlatformModuleContext = cache(async () => {
  const platform = await protectedPage({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_READ });
  const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
  return buildAnalyticsPlatformSnapshot(context);
});
