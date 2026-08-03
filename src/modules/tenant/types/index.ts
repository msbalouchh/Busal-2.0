export type { Industry } from "@/modules/tenant/types/industry";
export { INDUSTRIES } from "@/modules/tenant/types/industry";

export type {
  TenantStatus,
  WorkspaceStatus,
  OrganizationStatus,
  BusinessStatus,
  BranchStatus,
  StaffStatus,
} from "@/modules/tenant/types/status";
export {
  TENANT_STATUSES,
  WORKSPACE_STATUSES,
  ORGANIZATION_STATUSES,
  BUSINESS_STATUSES,
  BRANCH_STATUSES,
  STAFF_STATUSES,
} from "@/modules/tenant/types/status";

export type {
  DefaultRoleSlug,
  RoleSlug,
  Permission,
  Role,
  RoleAssignment,
} from "@/modules/tenant/types/rbac";
export { DEFAULT_ROLE_SLUGS } from "@/modules/tenant/types/rbac";

export type {
  Tenant,
  Organization,
  Workspace,
  Business,
  Branch,
  StaffMember,
  TenantSelection,
} from "@/modules/tenant/types/entities";

export type {
  TenantSnapshot,
  TenantContextValue,
  OrganizationContextValue,
  WorkspaceContextValue,
  BusinessContextValue,
  BranchContextValue,
  TenantFoundationContextValue,
} from "@/modules/tenant/types/context";
