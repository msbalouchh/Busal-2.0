import { SYSTEM_ROLE_SLUGS } from "@/modules/rbac/constants/system-roles";
import type { RbacEngineContext } from "@/modules/rbac/types/context";
import { hasPermission } from "@/modules/rbac/utils/permission-utils";
import { buildPermissionKey } from "@/modules/rbac/constants/permission-catalog";
import { PERMISSION_CATEGORIES } from "@/modules/rbac/constants/permission-categories";
import { PERMISSION_TYPES } from "@/modules/rbac/constants/permission-types";

export function canAccessBranch(context: RbacEngineContext, branchId: string): boolean {
  if (context.isOwner) {
    return true;
  }

  if (!context.branchId) {
    return hasPermission(
      context,
      buildPermissionKey(PERMISSION_CATEGORIES.BRANCHES, PERMISSION_TYPES.MANAGE),
    );
  }

  return context.branchId === branchId;
}

export function canAccessTenant(context: RbacEngineContext, tenantId: string): boolean {
  if (context.isOwner) {
    return true;
  }

  return context.tenantId === tenantId;
}

export function canAccessWorkspace(context: RbacEngineContext, workspaceId: string): boolean {
  if (context.isOwner || hasRoleAtLeast(context, SYSTEM_ROLE_SLUGS.BUSINESS_ADMIN)) {
    return context.workspaceId === workspaceId || context.workspaceId === null;
  }

  return context.workspaceId === workspaceId;
}

function hasRoleAtLeast(
  context: RbacEngineContext,
  minimumRole: (typeof SYSTEM_ROLE_SLUGS)[keyof typeof SYSTEM_ROLE_SLUGS],
): boolean {
  return context.roleSlugs.includes(minimumRole);
}
