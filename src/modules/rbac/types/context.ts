import type { AccessScope } from "@/modules/rbac/types/access-scope";
import type { Permission, PermissionGroup } from "@/modules/rbac/types/permission";
import type { Role, RoleGroup } from "@/modules/rbac/types/role";
import type {
  BranchAssignment,
  TenantAssignment,
  UserRoleAssignment,
  WorkspaceAssignment,
} from "@/modules/rbac/types/assignment";
import type { PermissionKey } from "@/modules/rbac/types/permission";
import type { RoleSlug } from "@/modules/rbac/types/role";

export interface RbacEngineContext {
  userId: string;
  tenantId: string | null;
  workspaceId: string | null;
  businessId: string | null;
  branchId: string | null;
  roleSlugs: RoleSlug[];
  permissionKeys: ReadonlySet<PermissionKey>;
  accessScope: AccessScope;
  isOwner: boolean;
}

export interface RbacSnapshot {
  permissions: Permission[];
  permissionGroups: PermissionGroup[];
  roles: Role[];
  roleGroups: RoleGroup[];
  userRoleAssignments: UserRoleAssignment[];
  tenantAssignments: TenantAssignment[];
  workspaceAssignments: WorkspaceAssignment[];
  branchAssignments: BranchAssignment[];
  context: RbacEngineContext;
}

export interface RbacContextValue {
  snapshot: RbacSnapshot;
  hasPermission: (permission: PermissionKey) => boolean;
  hasAnyPermission: (permissions: PermissionKey[]) => boolean;
  hasAllPermissions: (permissions: PermissionKey[]) => boolean;
  hasRole: (role: RoleSlug) => boolean;
  canAccessRoute: (route: string) => boolean;
  canAccessModule: (module: string) => boolean;
  canAccessBranch: (branchId: string) => boolean;
  canManageUser: (targetUserId: string) => boolean;
  refresh: () => void;
}
