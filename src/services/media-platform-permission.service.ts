import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveMediaPlatformPermissions(
  permissions: Set<string>,
  isOwner: boolean,
): {
  canView: boolean;
  canUpload: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canDownload: boolean;
  canManage: boolean;
} {
  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.MEDIA_VIEW),
    canUpload: isOwner || hasPermission(permissions, PERMISSION_CODES.MEDIA_UPLOAD),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.MEDIA_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.MEDIA_DELETE),
    canDownload: isOwner || hasPermission(permissions, PERMISSION_CODES.MEDIA_DOWNLOAD),
    canManage: isOwner || hasPermission(permissions, PERMISSION_CODES.MEDIA_MANAGE),
  };
}
