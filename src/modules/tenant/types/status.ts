export const TENANT_STATUSES = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  TRIAL: "trial",
  CHURNED: "churned",
} as const;

export type TenantStatus = (typeof TENANT_STATUSES)[keyof typeof TENANT_STATUSES];

export const WORKSPACE_STATUSES = {
  ACTIVE: "active",
  PROVISIONING: "provisioning",
  ARCHIVED: "archived",
} as const;

export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[keyof typeof WORKSPACE_STATUSES];

export const ORGANIZATION_STATUSES = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
} as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[keyof typeof ORGANIZATION_STATUSES];

export const BUSINESS_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
} as const;

export type BusinessStatus = (typeof BUSINESS_STATUSES)[keyof typeof BUSINESS_STATUSES];

export const BRANCH_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type BranchStatus = (typeof BRANCH_STATUSES)[keyof typeof BRANCH_STATUSES];

export const STAFF_STATUSES = {
  ACTIVE: "active",
  INVITED: "invited",
  SUSPENDED: "suspended",
  INACTIVE: "inactive",
} as const;

export type StaffStatus = (typeof STAFF_STATUSES)[keyof typeof STAFF_STATUSES];
