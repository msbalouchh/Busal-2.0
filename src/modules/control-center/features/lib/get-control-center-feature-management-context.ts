import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type { ControlCenterFeatureManagementQuery } from "@/modules/control-center/features/types/control-center-feature-management-types";
import { getControlCenterFeatureManagementBundle } from "@/services/control-center-feature-management.service";

export const getControlCenterFeatureManagementContext = cache(
  async (query: ControlCenterFeatureManagementQuery = {}) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS,
    });

    return getControlCenterFeatureManagementBundle(operator, query);
  },
);
