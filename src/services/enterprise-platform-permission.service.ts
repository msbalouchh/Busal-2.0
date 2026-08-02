import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveEnterprisePlatformPermissions(
  permissions: Set<string>,
  isOwner: boolean,
): {
  canView: boolean;
  canManage: boolean;
  canManageOrganizations: boolean;
  canManageIdentity: boolean;
  canManagePolicies: boolean;
} {
  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.ENTERPRISE_VIEW),
    canManage: isOwner || hasPermission(permissions, PERMISSION_CODES.ENTERPRISE_MANAGE),
    canManageOrganizations:
      isOwner || hasPermission(permissions, PERMISSION_CODES.ORGANIZATION_MANAGE),
    canManageIdentity: isOwner || hasPermission(permissions, PERMISSION_CODES.IDENTITY_MANAGE),
    canManagePolicies: isOwner || hasPermission(permissions, PERMISSION_CODES.POLICY_MANAGE),
  };
}
