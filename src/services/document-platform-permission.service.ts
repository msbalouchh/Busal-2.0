import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveDocumentPlatformPermissions(
  permissions: Set<string>,
  isOwner: boolean,
): {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canManage: boolean;
} {
  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.DOCUMENT_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.DOCUMENT_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.DOCUMENT_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.DOCUMENT_DELETE),
    canExport: isOwner || hasPermission(permissions, PERMISSION_CODES.DOCUMENT_EXPORT),
    canManage: isOwner || hasPermission(permissions, PERMISSION_CODES.DOCUMENT_MANAGE),
  };
}
