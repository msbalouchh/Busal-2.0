import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeBranchDashboard,
  serializeCentralBranchDashboard,
} from "@/modules/branches/utils/branch-utils";
import { getBranchDashboard, getCentralBranchDashboard } from "@/services/branch.service";

export const getBranchesOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.BRANCH_VIEW });
  const dashboard = await getCentralBranchDashboard(context.business.id);

  return {
    context,
    dashboard: serializeCentralBranchDashboard(dashboard),
  };
});

export const getBranchDetailContext = cache(async (branchId: string) => {
  const context = await protectedPage({ permission: PERMISSION_CODES.BRANCH_VIEW });
  const dashboard = await getBranchDashboard(context.business.id, branchId);

  return {
    context,
    dashboard: serializeBranchDashboard(dashboard),
  };
});
