import type { RoleSlug } from "@/modules/rbac/types/role";
import type { AccessScopeLevel } from "@/modules/rbac/types/access-scope";

export interface TenantAssignment {
  id: string;
  userId: string;
  tenantId: string;
  roleSlug: RoleSlug;
  assignedAt: string;
}

export interface WorkspaceAssignment {
  id: string;
  userId: string;
  tenantId: string;
  workspaceId: string;
  roleSlug: RoleSlug;
  assignedAt: string;
}

export interface BranchAssignment {
  id: string;
  userId: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  roleSlug: RoleSlug;
  assignedAt: string;
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  roleSlug: RoleSlug;
  scope: AccessScopeLevel;
  tenantId: string | null;
  workspaceId: string | null;
  businessId: string | null;
  branchId: string | null;
  assignedBy: string | null;
  assignedAt: string;
}
