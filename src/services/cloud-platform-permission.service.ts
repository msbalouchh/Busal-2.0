import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveCloudPlatformPermissions(
  permissions: Set<string>,
  isOwner: boolean,
): {
  canView: boolean;
  canManage: boolean;
  canManageSubscriptions: boolean;
  canManageTenants: boolean;
  canManagePlans: boolean;
  canManageLicenses: boolean;
} {
  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.CLOUD_VIEW),
    canManage: isOwner || hasPermission(permissions, PERMISSION_CODES.CLOUD_MANAGE),
    canManageSubscriptions:
      isOwner || hasPermission(permissions, PERMISSION_CODES.SUBSCRIPTION_MANAGE),
    canManageTenants: isOwner || hasPermission(permissions, PERMISSION_CODES.TENANT_MANAGE),
    canManagePlans: isOwner || hasPermission(permissions, PERMISSION_CODES.PLAN_MANAGE),
    canManageLicenses: isOwner || hasPermission(permissions, PERMISSION_CODES.LICENSE_MANAGE),
  };
}
