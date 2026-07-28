import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { getMenuManagementContext } from "@/services/menu-management.service";

export const getMenuModuleContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MENU_VIEW });
  const data = await getMenuManagementContext(context.business.ownerId, context.branchId);

  return { user: context.user, ...data };
});
