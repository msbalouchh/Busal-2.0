import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type {
  PlatformAutomationExecutionQuery,
  PlatformAutomationManagementQuery,
} from "@/modules/control-center/automation/types/control-center-platform-automation-types";
import { getControlCenterPlatformAutomationBundle } from "@/services/control-center-platform-automation.service";

export const getControlCenterPlatformAutomationContext = cache(
  async (
    query: PlatformAutomationManagementQuery = {},
    executionQuery: PlatformAutomationExecutionQuery = {},
  ) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_AUTOMATION,
    });

    return getControlCenterPlatformAutomationBundle(operator, query, executionQuery);
  },
);
