import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveSalesAgentPermissions(
  permissions: Set<string>,
  isOwner: boolean,
): {
  canView: boolean;
  canExecute: boolean;
  canManage: boolean;
} {
  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SALES_VIEW),
    canExecute: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SALES_EXECUTE),
    canManage: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SALES_MANAGE),
  };
}

export function assertSalesAgentViewPermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SALES_VIEW)) return;
  throw new Error("Permission denied: ai.sales.view required");
}

export function assertSalesAgentExecutePermission(
  permissions: Set<string>,
  isOwner: boolean,
): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SALES_EXECUTE)) return;
  throw new Error("Permission denied: ai.sales.execute required");
}

export function assertSalesAgentManagePermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SALES_MANAGE)) return;
  throw new Error("Permission denied: ai.sales.manage required");
}
