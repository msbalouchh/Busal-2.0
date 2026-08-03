import {
  DEFAULT_MOCK_SELECTION,
  MOCK_BRANCHES,
  MOCK_BUSINESSES,
  MOCK_ORGANIZATIONS,
  MOCK_PERMISSIONS,
  MOCK_ROLES,
  MOCK_STAFF,
  MOCK_TENANTS,
  MOCK_WORKSPACES,
} from "@/modules/tenant/constants/mock-tenant-data";
import type { TenantSelection } from "@/modules/tenant/types/entities";
import type { TenantSnapshot } from "@/modules/tenant/types/context";
import {
  filterBranchesByBusiness,
  filterBusinessesByOrganization,
  filterBusinessesByTenant,
  filterOrganizationsByTenant,
  filterRolesByWorkspace,
  filterStaffByWorkspace,
  filterWorkspacesByOrganization,
  filterWorkspacesByTenant,
  findBranch,
  findBusiness,
  findOrganization,
  findTenant,
  findWorkspace,
  resolveSelectionForBusiness,
  resolveSelectionForWorkspace,
} from "@/modules/tenant/utils/tenant-selectors";
import { assertSelectionIntegrity } from "@/modules/tenant/utils/tenant-isolation";

export interface MockTenantDataset {
  tenants: typeof MOCK_TENANTS;
  organizations: typeof MOCK_ORGANIZATIONS;
  workspaces: typeof MOCK_WORKSPACES;
  businesses: typeof MOCK_BUSINESSES;
  branches: typeof MOCK_BRANCHES;
  staff: typeof MOCK_STAFF;
  roles: typeof MOCK_ROLES;
  permissions: typeof MOCK_PERMISSIONS;
}

export function getMockTenantDataset(): MockTenantDataset {
  return {
    tenants: MOCK_TENANTS,
    organizations: MOCK_ORGANIZATIONS,
    workspaces: MOCK_WORKSPACES,
    businesses: MOCK_BUSINESSES,
    branches: MOCK_BRANCHES,
    staff: MOCK_STAFF,
    roles: MOCK_ROLES,
    permissions: MOCK_PERMISSIONS,
  };
}

export function buildTenantSnapshot(selection: TenantSelection): TenantSnapshot {
  assertSelectionIntegrity(selection);

  const dataset = getMockTenantDataset();
  const tenant = findTenant(dataset.tenants, selection.tenantId);
  const organization = findOrganization(dataset.organizations, selection.organizationId);
  const workspace = findWorkspace(dataset.workspaces, selection.workspaceId);
  const business = findBusiness(dataset.businesses, selection.businessId);
  const branch = findBranch(dataset.branches, selection.branchId);

  return {
    tenant,
    organization,
    workspace,
    business,
    branch,
    staff: filterStaffByWorkspace(dataset.staff, workspace.id),
    roles: filterRolesByWorkspace(dataset.roles, workspace.id),
    permissions: dataset.permissions,
    organizations: filterOrganizationsByTenant(dataset.organizations, tenant.id),
    workspaces: filterWorkspacesByTenant(dataset.workspaces, tenant.id),
    businesses: filterBusinessesByTenant(dataset.businesses, tenant.id),
    branches: filterBranchesByBusiness(dataset.branches, business.id),
    selection,
  };
}

export function getDefaultTenantSnapshot(): TenantSnapshot {
  return buildTenantSnapshot({ ...DEFAULT_MOCK_SELECTION });
}

export function selectTenant(tenantId: string): TenantSelection {
  const dataset = getMockTenantDataset();
  const tenant = findTenant(dataset.tenants, tenantId);
  const organization = findOrganization(dataset.organizations, tenant.organizationId);
  const workspaces = filterWorkspacesByOrganization(dataset.workspaces, organization.id);
  const workspace = workspaces[0];

  if (!workspace) {
    throw new Error(`[tenant] No workspace available for tenant ${tenantId}`);
  }

  return resolveSelectionForWorkspace(workspace, dataset.branches);
}

export function selectOrganization(organizationId: string): TenantSelection {
  const dataset = getMockTenantDataset();
  const organization = findOrganization(dataset.organizations, organizationId);
  const workspaces = filterWorkspacesByOrganization(dataset.workspaces, organization.id);
  const workspace = workspaces[0];

  if (!workspace) {
    throw new Error(`[tenant] No workspace available for organization ${organizationId}`);
  }

  return resolveSelectionForWorkspace(workspace, dataset.branches);
}

export function selectWorkspace(workspaceId: string): TenantSelection {
  const dataset = getMockTenantDataset();
  const workspace = findWorkspace(dataset.workspaces, workspaceId);
  return resolveSelectionForWorkspace(workspace, dataset.branches);
}

export function selectBusiness(businessId: string): TenantSelection {
  const dataset = getMockTenantDataset();
  const business = findBusiness(dataset.businesses, businessId);
  return resolveSelectionForBusiness(business, dataset.branches);
}

export function selectBranch(branchId: string, current: TenantSelection): TenantSelection {
  const dataset = getMockTenantDataset();
  const branch = findBranch(dataset.branches, branchId);

  if (branch.businessId !== current.businessId) {
    const business = findBusiness(dataset.businesses, branch.businessId);
    return {
      tenantId: business.tenantId,
      organizationId: business.organizationId,
      workspaceId: business.workspaceId,
      businessId: business.id,
      branchId: branch.id,
    };
  }

  return {
    ...current,
    branchId: branch.id,
  };
}

export function listOrganizationsForTenant(tenantId: string) {
  return filterOrganizationsByTenant(getMockTenantDataset().organizations, tenantId);
}

export function listWorkspacesForTenant(tenantId: string) {
  return filterWorkspacesByTenant(getMockTenantDataset().workspaces, tenantId);
}

export function listBusinessesForOrganization(organizationId: string) {
  return filterBusinessesByOrganization(getMockTenantDataset().businesses, organizationId);
}

export function listBranchesForBusiness(businessId: string) {
  return filterBranchesByBusiness(getMockTenantDataset().branches, businessId);
}
