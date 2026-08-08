import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";

/** Kitchen permission aliases mapped to platform authorization codes. */
export const KITCHEN_MODULE_PERMISSIONS = {
  KITCHEN_READ: PERMISSION_CODES.KITCHEN_VIEW,
  KITCHEN_UPDATE: PERMISSION_CODES.KITCHEN_UPDATE,
  KITCHEN_MANAGE: PERMISSION_CODES.KITCHEN_MANAGE,
  KITCHEN_ASSIGN_STATION: PERMISSION_CODES.KITCHEN_ASSIGN_STATION,
} as const;

export type KitchenModulePermissionCode =
  (typeof KITCHEN_MODULE_PERMISSIONS)[keyof typeof KITCHEN_MODULE_PERMISSIONS];
