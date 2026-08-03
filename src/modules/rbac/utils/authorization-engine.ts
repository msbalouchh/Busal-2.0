import type { PermissionKey } from "@/modules/rbac/types/permission";
import type { RbacEngineContext } from "@/modules/rbac/types/context";

import { canAccessBranch } from "@/modules/rbac/utils/branch-access";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "@/modules/rbac/utils/permission-utils";
import { canAccessModule, canAccessRoute } from "@/modules/rbac/utils/route-access";
import { hasRole } from "@/modules/rbac/utils/role-utils";
import { canManageUser } from "@/modules/rbac/utils/user-management";

export interface AuthorizationEngine {
  hasPermission: (permission: PermissionKey) => boolean;
  hasAnyPermission: (permissions: PermissionKey[]) => boolean;
  hasAllPermissions: (permissions: PermissionKey[]) => boolean;
  hasRole: (role: string) => boolean;
  canAccessRoute: (route: string) => boolean;
  canAccessModule: (module: string) => boolean;
  canAccessBranch: (branchId: string) => boolean;
  canManageUser: (targetUserId: string) => boolean;
}

export function createAuthorizationEngine(context: RbacEngineContext): AuthorizationEngine {
  return {
    hasPermission: (permission) => hasPermission(context, permission),
    hasAnyPermission: (permissions) => hasAnyPermission(context, permissions),
    hasAllPermissions: (permissions) => hasAllPermissions(context, permissions),
    hasRole: (role) => hasRole(context, role),
    canAccessRoute: (route) => canAccessRoute(context, route),
    canAccessModule: (module) => canAccessModule(context, module),
    canAccessBranch: (branchId) => canAccessBranch(context, branchId),
    canManageUser: (targetUserId) => canManageUser(context, targetUserId),
  };
}

export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  canAccessRoute,
  canAccessModule,
  canAccessBranch,
  canManageUser,
};
