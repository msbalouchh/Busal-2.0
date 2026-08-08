import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";

/** Analytics permission aliases mapped to platform authorization codes. */
export const ANALYTICS_MODULE_PERMISSIONS = {
  ANALYTICS_READ: PERMISSION_CODES.ANALYTICS_VIEW,
  ANALYTICS_CREATE: PERMISSION_CODES.ANALYTICS_CREATE_REPORT,
  ANALYTICS_EXPORT: PERMISSION_CODES.ANALYTICS_EXPORT,
  ANALYTICS_MANAGE: PERMISSION_CODES.ANALYTICS_EDIT_REPORT,
} as const;

export type AnalyticsModulePermissionCode =
  (typeof ANALYTICS_MODULE_PERMISSIONS)[keyof typeof ANALYTICS_MODULE_PERMISSIONS];
