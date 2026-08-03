import { SYSTEM_ROLE_SLUGS } from "@/modules/rbac/constants/system-roles";
import type { RbacEngineContext } from "@/modules/rbac/types/context";
import { buildPermissionKey } from "@/modules/rbac/constants/permission-catalog";
import { PERMISSION_CATEGORIES } from "@/modules/rbac/constants/permission-categories";
import { PERMISSION_TYPES } from "@/modules/rbac/constants/permission-types";
import { compareRoleAuthority } from "@/modules/rbac/utils/role-utils";
import { hasPermission } from "@/modules/rbac/utils/permission-utils";
import {
  MOCK_BRANCH_ASSIGNMENTS,
  MOCK_USER_ROLE_ASSIGNMENTS,
} from "@/modules/rbac/constants/mock-rbac-data";

export function canManageUser(context: RbacEngineContext, targetUserId: string): boolean {
  if (context.userId === targetUserId) {
    return false;
  }

  if (context.isOwner) {
    return true;
  }

  const canManageStaff = hasPermission(
    context,
    buildPermissionKey(PERMISSION_CATEGORIES.STAFF, PERMISSION_TYPES.MANAGE),
  );

  if (!canManageStaff) {
    return false;
  }

  const actorRoles = context.roleSlugs;
  const targetRoles = resolveUserRoleSlugs(targetUserId);

  if (targetRoles.includes(SYSTEM_ROLE_SLUGS.OWNER)) {
    return false;
  }

  return compareRoleAuthority(actorRoles, targetRoles);
}

function resolveUserRoleSlugs(userId: string): string[] {
  const assignments = MOCK_USER_ROLE_ASSIGNMENTS.filter((entry) => entry.userId === userId);

  if (assignments.length > 0) {
    return assignments.map((entry) => entry.roleSlug);
  }

  const branchAssignments = MOCK_BRANCH_ASSIGNMENTS.filter((entry) => entry.userId === userId);

  return branchAssignments.map((entry) => entry.roleSlug);
}

export function canAssignRole(context: RbacEngineContext, targetRoleSlug: string): boolean {
  if (context.isOwner) {
    return true;
  }

  const canAssign = hasPermission(
    context,
    buildPermissionKey(PERMISSION_CATEGORIES.STAFF, PERMISSION_TYPES.ASSIGN),
  );

  if (!canAssign) {
    return false;
  }

  if (targetRoleSlug === SYSTEM_ROLE_SLUGS.OWNER) {
    return false;
  }

  return compareRoleAuthority(context.roleSlugs, [targetRoleSlug]);
}
