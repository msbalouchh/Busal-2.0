import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";

/** POS permission aliases mapped to platform authorization codes. */
export const POS_MODULE_PERMISSIONS = {
  POS_READ: PERMISSION_CODES.POS_USE,
  POS_CREATE: PERMISSION_CODES.POS_USE,
  POS_UPDATE: PERMISSION_CODES.ORDER_UPDATE,
  POS_REFUND: PERMISSION_CODES.PAYMENT_REFUND,
  POS_CLOSE_SHIFT: PERMISSION_CODES.POS_USE,
} as const;

export type PosModulePermissionCode =
  (typeof POS_MODULE_PERMISSIONS)[keyof typeof POS_MODULE_PERMISSIONS];
