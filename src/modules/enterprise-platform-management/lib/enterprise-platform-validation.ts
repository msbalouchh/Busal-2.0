import type {
  PlatformEnterpriseAuditLog,
  PlatformEnterpriseIdentityProvider,
  PlatformEnterpriseOrganization,
  PlatformEnterpriseOrganizationUnit,
  PlatformEnterprisePolicy,
} from "@prisma/client";

import type {
  ComplianceSummaryRecord,
  EnterpriseAuditRecord,
  EnterprisePolicyRecord,
  EnterpriseSummaryRecord,
  IdentityProviderRecord,
  OrganizationRecord,
  OrganizationSettingsRecord,
  OrganizationUnitRecord,
} from "@/modules/enterprise-platform-management/types/enterprise-platform-types";
import type { getEnterpriseDashboardOverview } from "@/services/enterprise-platform-manager.service";
import type { ComplianceSummary } from "@/services/compliance-manager.service";
import { getProviderFramework } from "@/services/identity-provider-manager.service";

export function serializeOrganization(
  org: PlatformEnterpriseOrganization & {
    _count?: { units: number; identityProviders: number; policies: number };
  },
): OrganizationRecord {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    industry: org.industry,
    status: org.status,
    unitCount: org._count?.units ?? 0,
    providerCount: org._count?.identityProviders ?? 0,
    policyCount: org._count?.policies ?? 0,
    createdAt: org.createdAt.toISOString(),
  };
}

export function serializeOrganizationUnit(
  unit: PlatformEnterpriseOrganizationUnit & { organization?: { name: string } },
): OrganizationUnitRecord {
  return {
    id: unit.id,
    organizationId: unit.organizationId,
    organizationName: unit.organization?.name,
    parentId: unit.parentId,
    name: unit.name,
    type: unit.type,
    createdAt: unit.createdAt.toISOString(),
  };
}

export function serializeIdentityProvider(
  provider: PlatformEnterpriseIdentityProvider & { organization?: { name: string } },
): IdentityProviderRecord {
  return {
    id: provider.id,
    organizationId: provider.organizationId,
    organizationName: provider.organization?.name,
    name: provider.name,
    providerType: provider.providerType,
    status: provider.status,
    framework: getProviderFramework(provider.providerType),
    createdAt: provider.createdAt.toISOString(),
  };
}

export function serializeEnterprisePolicy(
  policy: PlatformEnterprisePolicy & { organization?: { name: string } },
): EnterprisePolicyRecord {
  return {
    id: policy.id,
    organizationId: policy.organizationId,
    organizationName: policy.organization?.name,
    name: policy.name,
    category: policy.category,
    enabled: policy.enabled,
    createdAt: policy.createdAt.toISOString(),
  };
}

export function serializeComplianceSummary(summary: ComplianceSummary): ComplianceSummaryRecord {
  return {
    score: summary.score,
    enabledPolicies: summary.enabledPolicies,
    totalPolicies: summary.totalPolicies,
    activeProviders: summary.activeProviders,
    totalProviders: summary.totalProviders,
    categories: summary.categories,
  };
}

export function serializeEnterpriseAudit(log: PlatformEnterpriseAuditLog): EnterpriseAuditRecord {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    message: log.message,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeEnterpriseSummary(
  overview: Awaited<ReturnType<typeof getEnterpriseDashboardOverview>>,
): EnterpriseSummaryRecord {
  return {
    organizationCount: overview.organizations.total,
    activeOrganizations: overview.organizations.active,
    identityProviderCount: overview.identityProviderCount,
    policyCount: overview.policyCount,
    complianceScore: overview.compliance.score,
    auditEvents7d: overview.audit.total7d,
  };
}

export function serializeOrganizationSettings(
  org: PlatformEnterpriseOrganization,
): OrganizationSettingsRecord {
  const settings =
    org.settings && typeof org.settings === "object" && !Array.isArray(org.settings)
      ? (org.settings as Record<string, unknown>)
      : {};
  return {
    organizationId: org.id,
    name: org.name,
    settings,
  };
}

export function validateOrganizationName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Organization name is required");
  if (trimmed.length > 200) throw new Error("Organization name is too long");
  return trimmed;
}

export function validateOrganizationSlug(slug: string): string {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) throw new Error("Organization slug is required");
  if (!/^[a-z0-9-]+$/.test(trimmed)) throw new Error("Slug must be lowercase alphanumeric");
  return trimmed;
}

export function validateProviderName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Provider name is required");
  return trimmed;
}

export function validatePolicyName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Policy name is required");
  return trimmed;
}
