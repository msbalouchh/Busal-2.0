import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type { ControlCenterAiUsageQuery } from "@/modules/control-center/ai-usage/types/control-center-ai-usage-types";
import { getControlCenterAiUsageBundle } from "@/services/control-center-ai-usage.service";

export const getControlCenterAiUsageContext = cache(async (query: ControlCenterAiUsageQuery = {}) => {
  const operator = await protectedControlCenterPage({
    permission: PERMISSION_CODES.CONTROL_CENTER_AI,
  });

  return getControlCenterAiUsageBundle(operator, query);
});
