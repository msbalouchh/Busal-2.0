import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveAppMarketplacePermissions(
  permissions: Set<string>,
  isOwner: boolean,
): {
  canView: boolean;
  canInstall: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManage: boolean;
} {
  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_VIEW),
    canInstall: isOwner || hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_INSTALL),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_DELETE),
    canManage:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_MANAGE) ||
      hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_ADMIN),
  };
}
