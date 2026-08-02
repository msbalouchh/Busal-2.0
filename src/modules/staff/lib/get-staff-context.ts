import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import type { StaffDirectoryQuery } from "@/modules/staff/types/staff-management-types";
import {
  getStaffManagementBundle,
  getStaffMemberProfile,
  listStaffMemberActivity,
} from "@/services/staff-management-module.service";

export const getStaffManagementContext = cache(async (query: StaffDirectoryQuery = {}) => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.STAFF_VIEW });
  const bundle = await getStaffManagementBundle(platform, query);

  return {
    platform,
    ...bundle,
  };
});

export const getStaffModuleContext = getStaffManagementContext;

export const getStaffProfileContext = cache(async (staffId: string) => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.STAFF_VIEW });
  const [member, activity] = await Promise.all([
    getStaffMemberProfile(platform, staffId),
    listStaffMemberActivity(platform, staffId),
  ]);

  return {
    platform,
    member,
    activity,
    permissionsFlags: (await getStaffManagementBundle(platform)).permissionsFlags,
  };
});
