import type { Industry } from "@/modules/tenant/types/industry";
import type { RoleSlug } from "@/modules/tenant/types/rbac";
import type {
  BranchStatus,
  BusinessStatus,
  OrganizationStatus,
  StaffStatus,
  TenantStatus,
  WorkspaceStatus,
} from "@/modules/tenant/types/status";

/**
 * Core multi-tenant hierarchy:
 * Tenant → Organization → Workspace → Business → Branch → Staff
 */

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  industry: Industry;
  status: TenantStatus;
  organizationId: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  status: OrganizationStatus;
  createdAt: string;
}

export interface Workspace {
  id: string;
  tenantId: string;
  organizationId: string;
  businessId: string;
  slug: string;
  name: string;
  status: WorkspaceStatus;
  createdAt: string;
}

export interface Business {
  id: string;
  tenantId: string;
  organizationId: string;
  workspaceId: string;
  slug: string;
  name: string;
  industry: Industry;
  status: BusinessStatus;
  timezone: string;
  currency: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  organizationId: string;
  workspaceId: string;
  businessId: string;
  slug: string;
  name: string;
  status: BranchStatus;
  isMain: boolean;
  timezone: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  tenantId: string;
  organizationId: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  userId: string;
  email: string;
  fullName: string;
  roleSlug: RoleSlug;
  status: StaffStatus;
  permissionKeys: string[];
  createdAt: string;
}

export interface TenantSelection {
  tenantId: string;
  organizationId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
}
