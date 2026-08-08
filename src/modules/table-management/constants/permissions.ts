import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";

/** Table management permission aliases mapped to platform authorization codes. */
export const TABLE_PERMISSIONS = {
  TABLE_READ: PERMISSION_CODES.TABLE_VIEW,
  TABLE_CREATE: PERMISSION_CODES.TABLE_CREATE,
  TABLE_UPDATE: PERMISSION_CODES.TABLE_UPDATE,
  TABLE_DELETE: PERMISSION_CODES.TABLE_DELETE,
  TABLE_MANAGE: PERMISSION_CODES.TABLE_MANAGE,
} as const;

export type TablePermissionCode = (typeof TABLE_PERMISSIONS)[keyof typeof TABLE_PERMISSIONS];
