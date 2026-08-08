import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type { PlatformIntelligenceQuery } from "@/modules/control-center/platform-intelligence/types/platform-intelligence-types";
import { getPlatformIntelligenceBundle } from "@/services/control-center-platform-intelligence.service";

export const getPlatformIntelligenceContext = cache(
  async (query: PlatformIntelligenceQuery = {}) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_INTELLIGENCE,
    });

    return getPlatformIntelligenceBundle(operator, query);
  },
);
