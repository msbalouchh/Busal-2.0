import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveObservabilityPlatformPermissions(
  permissions: Set<string>,
  isOwner: boolean,
): {
  canView: boolean;
  canManage: boolean;
  canManageIncidents: boolean;
  canViewLogs: boolean;
  canManageAlerts: boolean;
} {
  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.OBSERVABILITY_VIEW),
    canManage: isOwner || hasPermission(permissions, PERMISSION_CODES.OBSERVABILITY_MANAGE),
    canManageIncidents: isOwner || hasPermission(permissions, PERMISSION_CODES.INCIDENT_MANAGE),
    canViewLogs:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.LOGS_VIEW) ||
      hasPermission(permissions, PERMISSION_CODES.OBSERVABILITY_VIEW),
    canManageAlerts: isOwner || hasPermission(permissions, PERMISSION_CODES.ALERTS_MANAGE),
  };
}
