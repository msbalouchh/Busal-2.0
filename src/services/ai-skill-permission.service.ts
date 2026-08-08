import "server-only";

/** Non-inference service — no parallel AI execution. */

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";

export function resolveSkillPermissions(
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
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SKILL_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SKILL_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SKILL_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SKILL_DELETE),
    canExecute: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SKILL_EXECUTE),
  };
}

export function assertSkillViewPermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SKILL_VIEW)) return;
  throw new Error("Permission denied: ai.skill.view required");
}

export function assertSkillCreatePermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SKILL_CREATE)) return;
  throw new Error("Permission denied: ai.skill.create required");
}

export function assertSkillUpdatePermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SKILL_UPDATE)) return;
  throw new Error("Permission denied: ai.skill.update required");
}

export function assertSkillDeletePermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SKILL_DELETE)) return;
  throw new Error("Permission denied: ai.skill.delete required");
}

export function assertSkillExecutePermission(permissions: Set<string>, isOwner: boolean): void {
  if (isOwner || hasPermission(permissions, PERMISSION_CODES.AI_SKILL_EXECUTE)) return;
  throw new Error("Permission denied: ai.skill.execute required");
}
