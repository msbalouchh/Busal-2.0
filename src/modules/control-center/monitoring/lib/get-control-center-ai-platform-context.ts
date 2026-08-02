import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import { getControlCenterMonitoringManagementBundle } from "@/services/control-center-monitoring.service";

export const getControlCenterAiPlatformContext = cache(async () => {
  const operator = await protectedControlCenterPage({
    permission: PERMISSION_CODES.CONTROL_CENTER_AI,
  });

  return getControlCenterMonitoringManagementBundle(operator);
});
