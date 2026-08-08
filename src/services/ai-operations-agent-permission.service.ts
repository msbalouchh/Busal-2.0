import "server-only";

/** Non-inference service — no parallel AI execution. */

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveOperationsAgentPermissions(
  permissions: Set<string>,
  isOwner: boolean,
): {
  canView: boolean;
  canExecute: boolean;
  canManage: boolean;
} {
  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_OPERATIONS_VIEW),
    canExecute: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_OPERATIONS_EXECUTE),
    canManage: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_OPERATIONS_MANAGE),
  };
}
