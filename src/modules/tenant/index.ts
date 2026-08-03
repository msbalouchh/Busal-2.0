export type {
  Industry,
  TenantStatus,
  WorkspaceStatus,
  OrganizationStatus,
  BusinessStatus,
  BranchStatus,
  StaffStatus,
  DefaultRoleSlug,
  RoleSlug,
  Permission,
  Role,
  RoleAssignment,
  Tenant,
  Organization,
  Workspace,
  Business,
  Branch,
  StaffMember,
  TenantSelection,
  TenantSnapshot,
  TenantContextValue,
  OrganizationContextValue,
  WorkspaceContextValue,
  BusinessContextValue,
  BranchContextValue,
  TenantFoundationContextValue,
} from "@/modules/tenant/types";

export {
  INDUSTRIES,
  TENANT_STATUSES,
  WORKSPACE_STATUSES,
  ORGANIZATION_STATUSES,
  BUSINESS_STATUSES,
  BRANCH_STATUSES,
  STAFF_STATUSES,
  DEFAULT_ROLE_SLUGS,
} from "@/modules/tenant/types";

export {
  TENANT_PERMISSION_CATALOG,
  OWNER_PERMISSION_KEYS,
  MANAGER_PERMISSION_KEYS,
} from "@/modules/tenant/constants/permissions";
export {
  TENANT_INTEGRATION_POINTS,
  type TenantIntegrationPoint,
} from "@/modules/tenant/constants/integration-points";
export {
  MOCK_TENANTS,
  MOCK_ORGANIZATIONS,
  MOCK_WORKSPACES,
  MOCK_BUSINESSES,
  MOCK_BRANCHES,
  MOCK_ROLES,
  MOCK_STAFF,
  MOCK_PERMISSIONS,
  DEFAULT_MOCK_SELECTION,
} from "@/modules/tenant/constants/mock-tenant-data";

export {
  getMockTenantDataset,
  buildTenantSnapshot,
  getDefaultTenantSnapshot,
  selectTenant,
  selectOrganization,
  selectWorkspace,
  selectBusiness,
  selectBranch,
  listOrganizationsForTenant,
  listWorkspacesForTenant,
  listBusinessesForOrganization,
  listBranchesForBusiness,
} from "@/modules/tenant/services/mock-tenant.service";

export {
  assertSameTenant,
  assertSelectionIntegrity,
} from "@/modules/tenant/utils/tenant-isolation";
export {
  findTenant,
  findOrganization,
  findWorkspace,
  findBusiness,
  findBranch,
  filterOrganizationsByTenant,
  filterWorkspacesByTenant,
  filterBusinessesByTenant,
  filterBranchesByBusiness,
  filterStaffByWorkspace,
  resolveMainBranch,
  resolveSelectionForWorkspace,
  resolveSelectionForBusiness,
  hasPermissionKey,
} from "@/modules/tenant/utils/tenant-selectors";

export { TenantProvider } from "@/modules/tenant/providers/tenant-provider";
export { OrganizationProvider } from "@/modules/tenant/providers/organization-provider";
export { WorkspaceProvider } from "@/modules/tenant/providers/workspace-provider";
export { BranchProvider } from "@/modules/tenant/providers/branch-provider";
export { TenantFoundationProvider } from "@/modules/tenant/providers/tenant-foundation-provider";

export { useTenant, useTenantContext } from "@/modules/tenant/hooks/use-tenant";
export { useOrganization, useOrganizationContext } from "@/modules/tenant/hooks/use-organization";
export { useWorkspace, useWorkspaceContext } from "@/modules/tenant/hooks/use-workspace";
export { useBusiness, useBusinessContext } from "@/modules/tenant/hooks/use-business";
export { useBranch, useBranchContext } from "@/modules/tenant/hooks/use-branch";
export { useTenantFoundation } from "@/modules/tenant/hooks/use-tenant-foundation";

export { TenantScopeSummary } from "@/modules/tenant/components/tenant-scope-summary";
export { TenantWorkspaceSwitcher } from "@/modules/tenant/components/tenant-workspace-switcher";
export { TenantBusinessSwitcher } from "@/modules/tenant/components/tenant-business-switcher";
export { TenantBranchSwitcher } from "@/modules/tenant/components/tenant-branch-switcher";
