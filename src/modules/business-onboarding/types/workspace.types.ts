/** Multi-tenant domain primitives — maps to future database entities. */

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: "provisioning" | "active" | "suspended";
  createdAt: string;
}

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  status: "provisioning" | "ready" | "archived";
  ownerId: string;
}

export interface Business {
  id: string;
  tenantId: string;
  workspaceId: string;
  legalName: string;
  displayName: string;
  businessType: string;
  industry: string;
  email: string;
  phone: string;
  website: string | null;
  taxNumber: string | null;
  registrationNumber: string | null;
}

export interface Organization {
  id: string;
  tenantId: string;
  workspaceId: string;
  structure: "single" | "multi";
  branchCount: number;
  defaultBranchName: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;
  isDefault: boolean;
  country: string;
  city: string;
  timezone: string;
  currency: string;
}

export interface StaffMember {
  id: string;
  tenantId: string;
  workspaceId: string;
  email: string;
  role: string;
  status: "invited" | "active" | "inactive";
}

export interface PermissionGrant {
  id: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

export interface SubscriptionSelection {
  planId: string;
  trial: boolean;
  /** TODO: Stripe customer/subscription IDs after integration */
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface ModuleConfiguration {
  moduleId: string;
  enabled: boolean;
  tenantId: string;
}

export interface AiConfiguration {
  tenantId: string;
  enabledAgents: string[];
  /** TODO: AI platform initialization refs */
  orchestratorId: string | null;
}

export interface BrandIdentity {
  tenantId: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  themePreference: "light" | "dark" | "system";
}

/** Full provisioned workspace bundle returned after creation. */
export interface ProvisionedWorkspace {
  tenant: Tenant;
  workspace: Workspace;
  business: Business;
  organization: Organization;
  defaultBranch: Branch;
  subscription: SubscriptionSelection;
  modules: ModuleConfiguration[];
  ai: AiConfiguration;
  brand: BrandIdentity;
}
