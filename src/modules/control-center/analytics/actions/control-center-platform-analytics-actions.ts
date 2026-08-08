"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { CONTROL_CENTER_ANALYTICS_ROUTES } from "@/modules/control-center/analytics/constants/control-center-analytics";
import type { ControlCenterAnalyticsQuery } from "@/modules/control-center/analytics/types/control-center-analytics-types";
import {
  exportControlCenterPlatformAnalytics,
  getControlCenterPlatformAnalyticsBundle,
} from "@/services/control-center-platform-analytics.service";

function revalidateAnalyticsPage() {
  revalidatePath(CONTROL_CENTER_ANALYTICS_ROUTES.hub);
}

export async function refreshControlCenterPlatformAnalyticsAction(
  query: ControlCenterAnalyticsQuery = {},
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_ANALYTICS, async ({
    operator,
  }) => getControlCenterPlatformAnalyticsBundle(operator, query));
}

export async function exportControlCenterPlatformAnalyticsAction(
  query: ControlCenterAnalyticsQuery = {},
  format: "csv" | "json" = "json",
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_ANALYTICS, async ({
    operator,
  }) => exportControlCenterPlatformAnalytics(operator, query, format));
}

export async function queryControlCenterPlatformAnalyticsSectionAction(
  query: ControlCenterAnalyticsQuery,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_ANALYTICS, async ({
    operator,
  }) => {
    const bundle = await getControlCenterPlatformAnalyticsBundle(operator, query);
    revalidateAnalyticsPage();
    return bundle;
  });
}
