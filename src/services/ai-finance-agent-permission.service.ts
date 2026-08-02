import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveFinanceAgentPermissions(
  permissions: Set<string>,
  isOwner: boolean,
): {
  canView: boolean;
  canExecute: boolean;
  canManage: boolean;
} {
  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_FINANCE_VIEW),
    canExecute: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_FINANCE_EXECUTE),
    canManage: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_FINANCE_MANAGE),
  };
}
