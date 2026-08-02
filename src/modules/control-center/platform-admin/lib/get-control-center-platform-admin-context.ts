import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type {
  ControlCenterFeatureFlagQuery,
  ControlCenterPlatformAuditQuery,
  ControlCenterReleaseQuery,
  PlatformAdminView,
} from "@/modules/control-center/platform-admin/types/control-center-platform-admin-types";
import { getControlCenterPlatformAdminManagementBundle } from "@/services/control-center-platform-admin.service";

const VIEW_PERMISSIONS: Record<PlatformAdminView, string> = {
  overview: PERMISSION_CODES.CONTROL_CENTER_SETTINGS,
  settings: PERMISSION_CODES.CONTROL_CENTER_SETTINGS,
  "feature-flags": PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS,
  releases: PERMISSION_CODES.CONTROL_CENTER_RELEASES,
  environments: PERMISSION_CODES.CONTROL_CENTER_RELEASES,
  maintenance: PERMISSION_CODES.CONTROL_CENTER_MAINTENANCE,
  administration: PERMISSION_CODES.CONTROL_CENTER_SETTINGS,
  staff: PERMISSION_CODES.CONTROL_CENTER_STAFF,
  audit: PERMISSION_CODES.CONTROL_CENTER_AUDIT,
  analytics: PERMISSION_CODES.CONTROL_CENTER_ANALYTICS,
};

export const getControlCenterPlatformAdminContext = cache(
  async (
    view: PlatformAdminView = "overview",
    featureFlagQuery: ControlCenterFeatureFlagQuery = {},
    releaseQuery: ControlCenterReleaseQuery = {},
    auditQuery: ControlCenterPlatformAuditQuery = {},
  ) => {
    const operator = await protectedControlCenterPage({
      permission: VIEW_PERMISSIONS[view],
    });

    return getControlCenterPlatformAdminManagementBundle(
      operator,
      featureFlagQuery,
      releaseQuery,
      auditQuery,
    );
  },
);
