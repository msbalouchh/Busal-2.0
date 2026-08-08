import "server-only";

/** Non-inference service — no parallel AI execution. */

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveWorkflowPermissions(
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
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_WORKFLOW_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_WORKFLOW_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_WORKFLOW_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_WORKFLOW_DELETE),
    canExecute: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_WORKFLOW_EXECUTE),
  };
}

export function assertWorkflowViewPermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_WORKFLOW_VIEW)) return;
  throw new Error("Permission denied: ai.workflow.view required");
}

export function assertWorkflowCreatePermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_WORKFLOW_CREATE)) return;
  throw new Error("Permission denied: ai.workflow.create required");
}

export function assertWorkflowUpdatePermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_WORKFLOW_UPDATE)) return;
  throw new Error("Permission denied: ai.workflow.update required");
}

export function assertWorkflowDeletePermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_WORKFLOW_DELETE)) return;
  throw new Error("Permission denied: ai.workflow.delete required");
}

export function assertWorkflowExecutePermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_WORKFLOW_EXECUTE)) return;
  throw new Error("Permission denied: ai.workflow.execute required");
}
