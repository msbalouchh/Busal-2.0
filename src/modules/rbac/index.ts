export {
  createRbacRoleAction,
  deleteRbacRoleAction,
  saveRbacPermissionsAction,
  updateRbacRoleAction,
} from "@/modules/rbac/actions/rbac-actions";
export { RBAC_ROUTES } from "@/modules/rbac/constants/rbac-routes";

export {
  PERMISSION_CATEGORIES,
  PERMISSION_CATEGORY_LABELS,
  ALL_PERMISSION_CATEGORIES,
  type PermissionCategorySlug,
} from "@/modules/rbac/constants/permission-categories";
export {
  PERMISSION_TYPES,
  PERMISSION_TYPE_LABELS,
  ALL_PERMISSION_TYPES,
  type PermissionTypeSlug,
} from "@/modules/rbac/constants/permission-types";
export {
  SYSTEM_ROLE_SLUGS,
  SYSTEM_ROLE_LABELS,
  SYSTEM_ROLE_PRIORITY,
  ALL_SYSTEM_ROLE_SLUGS,
  type SystemRoleSlug,
} from "@/modules/rbac/constants/system-roles";
export {
  RBAC_PERMISSION_CATALOG,
  ALL_RBAC_PERMISSION_KEYS,
  READ_ONLY_PERMISSION_KEYS,
  buildPermissionKey,
  buildPermissionCatalog,
  CATEGORY_PERMISSION_TYPE_MATRIX,
} from "@/modules/rbac/constants/permission-catalog";
export { RBAC_PERMISSION_GROUPS } from "@/modules/rbac/constants/permission-groups";
export { RBAC_ROLE_GROUPS } from "@/modules/rbac/constants/role-groups";
export {
  ROUTE_PERMISSION_MAP,
  MODULE_PERMISSION_MAP,
} from "@/modules/rbac/constants/module-access";
export {
  RBAC_INTEGRATION_POINTS,
  type RbacIntegrationPoint,
} from "@/modules/rbac/constants/integration-points";
export {
  MOCK_RBAC_ROLES,
  MOCK_RBAC_PERMISSIONS,
  MOCK_RBAC_PERMISSION_GROUPS,
  MOCK_RBAC_ROLE_GROUPS,
  MOCK_USER_ROLE_ASSIGNMENTS,
  MOCK_BRANCH_ASSIGNMENTS,
  MOCK_WORKSPACE_ASSIGNMENTS,
  MOCK_TENANT_ASSIGNMENTS,
  DEFAULT_MOCK_RBAC_USER_ID,
  DEFAULT_MOCK_RBAC_SELECTION,
} from "@/modules/rbac/constants/mock-rbac-data";

export type {
  PermissionKey,
  Permission,
  PermissionGroup,
  RoleSlug,
  Role,
  RoleGroup,
  TenantAssignment,
  WorkspaceAssignment,
  BranchAssignment,
  UserRoleAssignment,
  AccessScopeLevel,
  AccessScope,
  RbacEngineContext,
  RbacSnapshot,
  RbacContextValue,
} from "@/modules/rbac/types";
export { ACCESS_SCOPE_LEVELS } from "@/modules/rbac/types";

export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  canAccessRoute,
  canAccessModule,
  canAccessBranch,
  canAccessTenant,
  canAccessWorkspace,
  canManageUser,
  canAssignRole,
  createAuthorizationEngine,
  type AuthorizationEngine,
} from "@/modules/rbac/utils";

export {
  buildRbacFoundationSnapshot,
  type RbacFoundationInput,
} from "@/modules/rbac/services/rbac-foundation.service";

/** @deprecated Dev/test fixtures only — use buildRbacFoundationSnapshot in production. */
export type { RbacSelectionInput } from "@/modules/rbac/types/selection";

export {
  buildRbacEngineContext,
  buildRbacSnapshot,
  getDefaultRbacSnapshot,
  createRbacContextValue,
} from "@/modules/rbac/services/mock-rbac.service";

export { RbacProvider } from "@/modules/rbac/providers/rbac-provider";
export { RbacContext } from "@/modules/rbac/contexts/rbac-context";

export { useRbac, useRbacContext } from "@/modules/rbac/hooks/use-rbac";
export {
  usePermission,
  useAnyPermission,
  useAllPermissions,
  useCanAccessRoute,
  useCanAccessModule,
  useCanAccessBranch,
  useCanManageUser,
} from "@/modules/rbac/hooks/use-permission";
export { useRole, useRoles } from "@/modules/rbac/hooks/use-role";

export { RbacAccessGate } from "@/modules/rbac/components/rbac-access-gate";
export { RbacPermissionBadge } from "@/modules/rbac/components/rbac-permission-badge";

export { RbacManagementPanel } from "@/modules/rbac/components/rbac-management-panel";
export {
  getRbacManagementContext,
  requireRbacActionContext,
} from "@/modules/rbac/lib/get-rbac-context";
