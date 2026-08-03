import type {
  Branch,
  Business,
  Organization,
  StaffMember,
  Tenant,
  TenantSelection,
  Workspace,
} from "@/modules/tenant/types/entities";
import type { Permission, Role } from "@/modules/tenant/types/rbac";

export interface TenantSnapshot {
  tenant: Tenant;
  organization: Organization;
  workspace: Workspace;
  business: Business;
  branch: Branch;
  staff: StaffMember[];
  roles: Role[];
  permissions: Permission[];
  organizations: Organization[];
  workspaces: Workspace[];
  businesses: Business[];
  branches: Branch[];
  selection: TenantSelection;
}

export interface TenantContextValue {
  tenant: Tenant;
  organizations: Organization[];
  workspaces: Workspace[];
  businesses: Business[];
  selection: TenantSelection;
  switchTenant: (tenantId: string) => void;
}

export interface OrganizationContextValue {
  organization: Organization;
  organizations: Organization[];
  switchOrganization: (organizationId: string) => void;
}

export interface WorkspaceContextValue {
  workspace: Workspace;
  workspaces: Workspace[];
  switchWorkspace: (workspaceId: string) => void;
}

export interface BusinessContextValue {
  business: Business;
  businesses: Business[];
  switchBusiness: (businessId: string) => void;
}

export interface BranchContextValue {
  branch: Branch;
  branches: Branch[];
  switchBranch: (branchId: string) => void;
}

export interface TenantFoundationContextValue
  extends
    TenantContextValue,
    OrganizationContextValue,
    WorkspaceContextValue,
    BusinessContextValue,
    BranchContextValue {
  staff: StaffMember[];
  roles: Role[];
  permissions: Permission[];
  hasPermission: (permissionKey: string) => boolean;
  snapshot: TenantSnapshot;
}
