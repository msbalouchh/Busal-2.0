export {
  createAuthorizationEngine,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  canAccessRoute,
  canAccessModule,
  canAccessBranch,
  canManageUser,
  type AuthorizationEngine,
} from "@/modules/rbac/utils/authorization-engine";

export {
  buildRbacFoundationSnapshot,
  type RbacFoundationInput,
} from "@/modules/rbac/services/rbac-foundation.service";
