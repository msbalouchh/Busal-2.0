import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { getStaffManagementContext } from "@/services/staff-management.service";

export const getStaffModuleContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.STAFF_VIEW });
  const data = await getStaffManagementContext(context.business.ownerId, context.branchId);

  return { user: context.user, ...data };
});
