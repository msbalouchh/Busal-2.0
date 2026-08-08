import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";

/** Inventory permission aliases mapped to platform authorization codes. */
export const INVENTORY_MODULE_PERMISSIONS = {
  INVENTORY_READ: PERMISSION_CODES.INVENTORY_VIEW,
  INVENTORY_CREATE: PERMISSION_CODES.INVENTORY_CREATE,
  INVENTORY_UPDATE: PERMISSION_CODES.INVENTORY_UPDATE,
  INVENTORY_DELETE: PERMISSION_CODES.INVENTORY_DELETE,
} as const;

export type InventoryModulePermissionCode =
  (typeof INVENTORY_MODULE_PERMISSIONS)[keyof typeof INVENTORY_MODULE_PERMISSIONS];
