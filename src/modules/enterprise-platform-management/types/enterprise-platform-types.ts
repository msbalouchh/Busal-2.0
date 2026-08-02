import type {
  PlatformEnterpriseIdentityProviderType,
  PlatformEnterpriseOrganizationStatus,
  PlatformEnterprisePolicyCategory,
  PlatformEnterpriseProviderStatus,
} from "@prisma/client";

export interface EnterpriseSummaryRecord {
  organizationCount: number;
  activeOrganizations: number;
  identityProviderCount: number;
  policyCount: number;
  complianceScore: number;
  auditEvents7d: number;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  industry: string;
  status: PlatformEnterpriseOrganizationStatus;
  unitCount: number;
  providerCount: number;
  policyCount: number;
  createdAt: string;
}

export interface OrganizationUnitRecord {
  id: string;
  organizationId: string;
  organizationName?: string;
  parentId: string | null;
  name: string;
  type: string;
  createdAt: string;
}

export interface IdentityProviderRecord {
  id: string;
  organizationId: string;
  organizationName?: string;
  name: string;
  providerType: PlatformEnterpriseIdentityProviderType;
  status: PlatformEnterpriseProviderStatus;
  framework: string;
  createdAt: string;
}

export interface EnterprisePolicyRecord {
  id: string;
  organizationId: string;
  organizationName?: string;
  name: string;
  category: PlatformEnterprisePolicyCategory;
  enabled: boolean;
  createdAt: string;
}

export interface ComplianceSummaryRecord {
  score: number;
  enabledPolicies: number;
  totalPolicies: number;
  activeProviders: number;
  totalProviders: number;
  categories: Array<{ category: string; enabled: number; total: number }>;
}

export interface EnterpriseAuditRecord {
  id: string;
  action: string;
  entityType: string;
  message: string;
  createdAt: string;
}

export interface OrganizationSettingsRecord {
  organizationId: string;
  name: string;
  settings: Record<string, unknown>;
}
