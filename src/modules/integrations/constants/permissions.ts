import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";

/** Integration / Developer API permission aliases mapped to platform authorization codes. */
export const INTEGRATION_MODULE_PERMISSIONS = {
  API_READ: PERMISSION_CODES.INTEGRATION_VIEW,
  API_CREATE: PERMISSION_CODES.INTEGRATION_CREATE,
  API_UPDATE: PERMISSION_CODES.INTEGRATION_UPDATE,
  API_DELETE: PERMISSION_CODES.INTEGRATION_DELETE,
  API_MANAGE: PERMISSION_CODES.INTEGRATION_MANAGE,
} as const;

export type IntegrationModulePermissionCode =
  (typeof INTEGRATION_MODULE_PERMISSIONS)[keyof typeof INTEGRATION_MODULE_PERMISSIONS];
