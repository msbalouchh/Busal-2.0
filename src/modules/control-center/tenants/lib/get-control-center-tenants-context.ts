import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type { ControlCenterTenantDirectoryQuery } from "@/modules/control-center/tenants/types/control-center-tenants-types";
import {
  getControlCenterTenantDetailBundle,
  getControlCenterTenantManagementBundle,
} from "@/services/control-center-tenants.service";

export const getControlCenterTenantsContext = cache(
  async (query: ControlCenterTenantDirectoryQuery = {}) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_TENANTS,
    });

    return getControlCenterTenantManagementBundle(operator, query);
  },
);

export const getControlCenterTenantDetailContext = cache(async (businessId: string) => {
  const operator = await protectedControlCenterPage({
    permission: PERMISSION_CODES.CONTROL_CENTER_TENANTS,
  });

  return getControlCenterTenantDetailBundle(operator, businessId);
});
