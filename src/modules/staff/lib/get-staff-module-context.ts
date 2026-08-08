import { cache } from "react";

import { STAFF_MODULE_PERMISSIONS } from "@/modules/staff/constants/permissions";
import { resolveStaffScope, toStaffPlatformContext } from "@/modules/staff/lib/staff-scope";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { buildStaffPlatformSnapshot } from "@/modules/staff/services/staff-platform.service";
import { staffService } from "@/modules/staff/services/staff.service";

export const getStaffPlatformModuleContext = cache(async () => {
  const platform = await protectedPage({ permission: STAFF_MODULE_PERMISSIONS.STAFF_READ });
  const scope = resolveStaffScope(platform);
  const context = toStaffPlatformContext(scope);

  const [snapshot, departments, designations] = await Promise.all([
    buildStaffPlatformSnapshot(context),
    staffService.listDepartments(context),
    staffService.listDesignations(context),
  ]);

  return {
    ...snapshot,
    departments,
    designations,
  };
});
