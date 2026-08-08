import "server-only";

/** Non-inference service — no parallel AI execution. */

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveMemoryPermissions(
  permissions: Set<string>,
  isOwner: boolean,
): {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
} {
  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_MEMORY_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_MEMORY_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_MEMORY_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_MEMORY_DELETE),
  };
}

export function assertMemoryViewPermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_MEMORY_VIEW)) return;
  throw new Error("Permission denied: ai.memory.view required");
}

export function assertMemoryCreatePermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_MEMORY_CREATE)) return;
  throw new Error("Permission denied: ai.memory.create required");
}

export function assertMemoryUpdatePermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_MEMORY_UPDATE)) return;
  throw new Error("Permission denied: ai.memory.update required");
}

export function assertMemoryDeletePermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_MEMORY_DELETE)) return;
  throw new Error("Permission denied: ai.memory.delete required");
}
