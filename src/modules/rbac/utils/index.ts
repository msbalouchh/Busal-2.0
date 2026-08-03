export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasAnyPermissionPrefix,
  normalizePermissionKeys,
} from "@/modules/rbac/utils/permission-utils";
export {
  hasRole,
  hasAnyRole,
  compareRoleAuthority,
  resolveHighestRolePriority,
} from "@/modules/rbac/utils/role-utils";
export {
  canAccessRoute,
  canAccessModule,
  canAccessRoutes,
  canAccessModules,
  resolveModuleRequirements,
} from "@/modules/rbac/utils/route-access";
export {
  canAccessBranch,
  canAccessTenant,
  canAccessWorkspace,
} from "@/modules/rbac/utils/branch-access";
export { canManageUser, canAssignRole } from "@/modules/rbac/utils/user-management";
export {
  createAuthorizationEngine,
  type AuthorizationEngine,
} from "@/modules/rbac/utils/authorization-engine";
