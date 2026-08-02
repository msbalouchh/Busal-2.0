import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import type { PlatformAgentRecord } from "@/modules/ai-agent-platform-management/types/ai-agent-platform-types";

export function assertAgentViewPermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_AGENT_VIEW)) return;
  throw new Error("Permission denied: ai.agent.view required");
}

export function assertAgentCreatePermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_AGENT_CREATE)) return;
  throw new Error("Permission denied: ai.agent.create required");
}

export function assertAgentUpdatePermission(permissions: Set<string>, isOwner: boolean): void {
  const allowed =
    isOwner ||
    hasPermission(permissions, PERMISSION_CODES.AI_AGENT_UPDATE) ||
    hasPermission(permissions, PERMISSION_CODES.AI_AGENT_EDIT);
  if (!allowed) throw new Error("Permission denied: ai.agent.update required");
}

export function assertAgentDeletePermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_AGENT_DELETE)) return;
  throw new Error("Permission denied: ai.agent.delete required");
}

export function assertAgentExecutionPermission(
  permissions: Set<string>,
  agent: PlatformAgentRecord,
  isOwner = false,
): void {
  if (isOwner) return;
  const required =
    agent.permissions.length > 0 ? agent.permissions : [PERMISSION_CODES.AI_AGENT_EXECUTE];
  const allowed =
    permissions.has(PERMISSION_CODES.AI_AGENT_EXECUTE) ||
    required.some((permission) => permissions.has(permission));
  if (!allowed) {
    throw new Error("Permission denied: ai.agent.execute required");
  }
}

export function resolveAgentPlatformPermissions(
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
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_AGENT_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_AGENT_CREATE),
    canUpdate:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.AI_AGENT_UPDATE) ||
      hasPermission(permissions, PERMISSION_CODES.AI_AGENT_EDIT),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_AGENT_DELETE),
    canExecute: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_AGENT_EXECUTE),
  };
}
