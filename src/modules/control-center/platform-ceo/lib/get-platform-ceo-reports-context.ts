import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import { getPlatformCeoReportsBundle } from "@/services/control-center-platform-ceo-intelligence.service";

export const getPlatformCeoReportsContext = cache(async () => {
  const operator = await protectedControlCenterPage({
    permission: PERMISSION_CODES.CONTROL_CENTER_CEO,
  });

  return getPlatformCeoReportsBundle(operator);
});
