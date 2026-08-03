import type {
  Branch,
  Business,
  Organization,
  StaffMember,
  Tenant,
  TenantSelection,
  Workspace,
} from "@/modules/tenant/types/entities";
import type { Role } from "@/modules/tenant/types/rbac";

export function requireEntity<T>(entity: T | undefined, label: string): T {
  if (!entity) {
    throw new Error(`[tenant] Unable to resolve ${label}`);
  }

  return entity;
}

export function findTenant(tenants: Tenant[], tenantId: string): Tenant {
  return requireEntity(
    tenants.find((tenant) => tenant.id === tenantId),
    `tenant:${tenantId}`,
  );
}

export function findOrganization(
  organizations: Organization[],
  organizationId: string,
): Organization {
  return requireEntity(
    organizations.find((organization) => organization.id === organizationId),
    `organization:${organizationId}`,
  );
}

export function findWorkspace(workspaces: Workspace[], workspaceId: string): Workspace {
  return requireEntity(
    workspaces.find((workspace) => workspace.id === workspaceId),
    `workspace:${workspaceId}`,
  );
}

export function findBusiness(businesses: Business[], businessId: string): Business {
  return requireEntity(
    businesses.find((business) => business.id === businessId),
    `business:${businessId}`,
  );
}

export function findBranch(branches: Branch[], branchId: string): Branch {
  return requireEntity(
    branches.find((branch) => branch.id === branchId),
    `branch:${branchId}`,
  );
}

export function filterOrganizationsByTenant(
  organizations: Organization[],
  tenantId: string,
): Organization[] {
  return organizations.filter((organization) => organization.tenantId === tenantId);
}

export function filterWorkspacesByOrganization(
  workspaces: Workspace[],
  organizationId: string,
): Workspace[] {
  return workspaces.filter((workspace) => workspace.organizationId === organizationId);
}

export function filterWorkspacesByTenant(workspaces: Workspace[], tenantId: string): Workspace[] {
  return workspaces.filter((workspace) => workspace.tenantId === tenantId);
}

export function filterBusinessesByTenant(businesses: Business[], tenantId: string): Business[] {
  return businesses.filter((business) => business.tenantId === tenantId);
}

export function filterBusinessesByOrganization(
  businesses: Business[],
  organizationId: string,
): Business[] {
  return businesses.filter((business) => business.organizationId === organizationId);
}

export function filterBranchesByBusiness(branches: Branch[], businessId: string): Branch[] {
  return branches.filter((branch) => branch.businessId === businessId);
}

export function filterStaffByWorkspace(staff: StaffMember[], workspaceId: string): StaffMember[] {
  return staff.filter((member) => member.workspaceId === workspaceId);
}

export function filterRolesByWorkspace(roles: Role[], workspaceId: string): Role[] {
  return roles.filter((role) => role.workspaceId === workspaceId);
}

export function resolveMainBranch(branches: Branch[]): Branch {
  return requireEntity(branches.find((branch) => branch.isMain) ?? branches[0], "main branch");
}

export function resolveSelectionForWorkspace(
  workspace: Workspace,
  branches: Branch[],
): TenantSelection {
  const businessBranches = filterBranchesByBusiness(branches, workspace.businessId);
  const branch = resolveMainBranch(businessBranches);

  return {
    tenantId: workspace.tenantId,
    organizationId: workspace.organizationId,
    workspaceId: workspace.id,
    businessId: workspace.businessId,
    branchId: branch.id,
  };
}

export function resolveSelectionForBusiness(
  business: Business,
  branches: Branch[],
): TenantSelection {
  const businessBranches = filterBranchesByBusiness(branches, business.id);
  const branch = resolveMainBranch(businessBranches);

  return {
    tenantId: business.tenantId,
    organizationId: business.organizationId,
    workspaceId: business.workspaceId,
    businessId: business.id,
    branchId: branch.id,
  };
}

export function hasPermissionKey(permissionKeys: string[], permissionKey: string): boolean {
  return permissionKeys.includes(permissionKey);
}
