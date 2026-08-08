import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type { ControlCenterBusinessDirectoryQuery } from "@/modules/control-center/businesses/types/control-center-businesses-types";
import {
  getControlCenterBusinessDetailBundle,
  getControlCenterBusinessManagementBundle,
} from "@/services/control-center-businesses.service";

export const getControlCenterBusinessesContext = cache(
  async (query: ControlCenterBusinessDirectoryQuery = {}) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_BUSINESSES,
    });

    return getControlCenterBusinessManagementBundle(operator, query);
  },
);

export const getControlCenterBusinessDetailContext = cache(async (businessId: string) => {
  const operator = await protectedControlCenterPage({
    permission: PERMISSION_CODES.CONTROL_CENTER_BUSINESSES,
  });

  return getControlCenterBusinessDetailBundle(operator, businessId);
});
