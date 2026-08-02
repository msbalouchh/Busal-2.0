import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import { getControlCenterBillingManagementBundle } from "@/services/control-center-billing.service";

export const getControlCenterRevenueContext = cache(async () => {
  const operator = await protectedControlCenterPage({
    permission: PERMISSION_CODES.CONTROL_CENTER_REVENUE,
  });

  return getControlCenterBillingManagementBundle(operator, {});
});
