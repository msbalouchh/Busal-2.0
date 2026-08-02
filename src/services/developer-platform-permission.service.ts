import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveDeveloperPlatformPermissions(
  permissions: Set<string>,
  isOwner: boolean,
): {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManage: boolean;
} {
  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.DEVELOPER_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.DEVELOPER_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.DEVELOPER_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.DEVELOPER_DELETE),
    canManage: isOwner || hasPermission(permissions, PERMISSION_CODES.DEVELOPER_MANAGE),
  };
}
