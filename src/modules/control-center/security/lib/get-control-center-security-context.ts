import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type { ControlCenterSecuritySessionQuery } from "@/modules/control-center/security/types/control-center-security-types";
import { getControlCenterSecurityManagementBundle } from "@/services/control-center-security.service";

export const getControlCenterSecurityContext = cache(
  async (query: ControlCenterSecuritySessionQuery = {}) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_SECURITY,
    });

    return getControlCenterSecurityManagementBundle(operator, query);
  },
);
