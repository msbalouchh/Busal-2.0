import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";

/** Staff permission aliases mapped to platform authorization codes. */
export const STAFF_MODULE_PERMISSIONS = {
  STAFF_READ: PERMISSION_CODES.STAFF_VIEW,
  STAFF_CREATE: PERMISSION_CODES.STAFF_CREATE,
  STAFF_UPDATE: PERMISSION_CODES.STAFF_UPDATE,
  STAFF_DELETE: PERMISSION_CODES.STAFF_DELETE,
  STAFF_MANAGE: PERMISSION_CODES.STAFF_ASSIGN_ROLE,
} as const;

export type StaffModulePermissionCode =
  (typeof STAFF_MODULE_PERMISSIONS)[keyof typeof STAFF_MODULE_PERMISSIONS];
