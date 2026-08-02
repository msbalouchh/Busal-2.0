import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type { ControlCenterSubscriptionDirectoryQuery } from "@/modules/control-center/billing/types/control-center-billing-types";
import {
  getControlCenterBillingManagementBundle,
  getControlCenterSubscriptionDetailBundle,
} from "@/services/control-center-billing.service";

export const getControlCenterBillingContext = cache(
  async (query: ControlCenterSubscriptionDirectoryQuery = {}) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_SUBSCRIPTIONS,
    });

    return getControlCenterBillingManagementBundle(operator, query);
  },
);

export const getControlCenterSubscriptionDetailContext = cache(async (businessId: string) => {
  const operator = await protectedControlCenterPage({
    permission: PERMISSION_CODES.CONTROL_CENTER_SUBSCRIPTIONS,
  });

  return getControlCenterSubscriptionDetailBundle(operator, businessId);
});
