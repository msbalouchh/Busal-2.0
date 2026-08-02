import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveMarketingAgentPermissions(
  permissions: Set<string>,
  isOwner: boolean,
): {
  canView: boolean;
  canExecute: boolean;
  canManage: boolean;
} {
  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_MARKETING_VIEW),
    canExecute: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_MARKETING_EXECUTE),
    canManage: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_MARKETING_MANAGE),
  };
}

export function assertMarketingAgentViewPermission(
  permissions: Set<string>,
  isOwner: boolean,
): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_MARKETING_VIEW)) return;
  throw new Error("Permission denied: ai.marketing.view required");
}

export function assertMarketingAgentExecutePermission(
  permissions: Set<string>,
  isOwner: boolean,
): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_MARKETING_EXECUTE)) return;
  throw new Error("Permission denied: ai.marketing.execute required");
}

export function assertMarketingAgentManagePermission(
  permissions: Set<string>,
  isOwner: boolean,
): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_MARKETING_MANAGE)) return;
  throw new Error("Permission denied: ai.marketing.manage required");
}
