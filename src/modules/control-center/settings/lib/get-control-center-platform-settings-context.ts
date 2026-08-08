import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type { ControlCenterPlatformSettingsQuery } from "@/modules/control-center/settings/types/control-center-platform-settings-types";
import { getControlCenterPlatformSettingsBundle } from "@/services/control-center-platform-settings.service";

export const getControlCenterPlatformSettingsContext = cache(
  async (query: ControlCenterPlatformSettingsQuery = {}) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_SETTINGS,
    });

    return getControlCenterPlatformSettingsBundle(operator, query);
  },
);
