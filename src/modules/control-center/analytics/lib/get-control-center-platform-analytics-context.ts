import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type { ControlCenterAnalyticsQuery } from "@/modules/control-center/analytics/types/control-center-analytics-types";
import { getControlCenterPlatformAnalyticsBundle } from "@/services/control-center-platform-analytics.service";

export const getControlCenterPlatformAnalyticsContext = cache(
  async (query: ControlCenterAnalyticsQuery = {}) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_ANALYTICS,
    });

    return getControlCenterPlatformAnalyticsBundle(operator, query);
  },
);
