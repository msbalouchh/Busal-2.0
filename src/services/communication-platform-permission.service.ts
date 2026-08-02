import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveCommunicationPlatformPermissions(
  permissions: Set<string>,
  isOwner: boolean,
): {
  canView: boolean;
  canCreate: boolean;
  canSend: boolean;
  canManage: boolean;
  canDelete: boolean;
} {
  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.COMMUNICATION_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.COMMUNICATION_CREATE),
    canSend: isOwner || hasPermission(permissions, PERMISSION_CODES.COMMUNICATION_SEND),
    canManage: isOwner || hasPermission(permissions, PERMISSION_CODES.COMMUNICATION_MANAGE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.COMMUNICATION_DELETE),
  };
}
