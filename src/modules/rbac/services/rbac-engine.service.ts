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
  buildRbacEngineContext,
  buildRbacSnapshot,
  getDefaultRbacSnapshot,
  createRbacContextValue,
} from "@/modules/rbac/services/mock-rbac.service";
