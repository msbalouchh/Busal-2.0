import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type { ControlCenterCatalogQuery } from "@/modules/control-center/marketplace/types/control-center-marketplace-types";
import { getControlCenterMarketplaceManagementBundle } from "@/services/control-center-marketplace.service";

export const getControlCenterMarketplaceContext = cache(
  async (query: ControlCenterCatalogQuery = {}) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE,
    });

    return getControlCenterMarketplaceManagementBundle(operator, query);
  },
);
