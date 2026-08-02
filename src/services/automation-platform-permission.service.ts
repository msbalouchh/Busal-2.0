import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveAutomationPlatformPermissions(
  permissions: Set<string>,
  isOwner: boolean,
): {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExecute: boolean;
} {
  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.AUTOMATION_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.AUTOMATION_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.AUTOMATION_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.AUTOMATION_DELETE),
    canExecute: isOwner || hasPermission(permissions, PERMISSION_CODES.AUTOMATION_EXECUTE),
  };
}
