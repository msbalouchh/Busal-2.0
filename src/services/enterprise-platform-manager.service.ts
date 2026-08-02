import "server-only";

import { ensureDefaultOrganization } from "@/services/organization-manager.service";
import { ensureDefaultIdentityProviders } from "@/services/identity-provider-manager.service";
import { ensureDefaultPolicies } from "@/services/enterprise-policy-manager.service";
import { getOrganizationsSummary } from "@/services/organization-manager.service";
import { listIdentityProviders } from "@/services/identity-provider-manager.service";
import { listEnterprisePolicies } from "@/services/enterprise-policy-manager.service";
import { getComplianceDashboard } from "@/services/compliance-manager.service";
import { getEnterpriseAuditSummary } from "@/services/enterprise-audit.service";
import { listDirectorySyncStatus } from "@/services/directory-sync-framework.service";

export async function ensureEnterpriseSeedData(ownerId: string) {
  await ensureDefaultOrganization(ownerId);
  await ensureDefaultIdentityProviders(ownerId);
  await ensureDefaultPolicies(ownerId);
}

export async function getEnterpriseDashboardOverview(ownerId: string) {
  await ensureEnterpriseSeedData(ownerId);
  const [organizations, identityProviders, policies, compliance, audit, directorySync] =
    await Promise.all([
      getOrganizationsSummary(ownerId),
      listIdentityProviders(ownerId),
      listEnterprisePolicies(ownerId),
      getComplianceDashboard(ownerId),
      getEnterpriseAuditSummary(ownerId),
      listDirectorySyncStatus(ownerId),
    ]);

  return {
    organizations,
    identityProviderCount: identityProviders.length,
    policyCount: policies.length,
    compliance,
    audit,
    directorySync,
  };
}

export async function searchEnterprise(ownerId: string, query: string) {
  const { listOrganizations } = await import("@/services/organization-manager.service");
  const organizations = await listOrganizations(ownerId, { search: query.trim() });
  return { organizations };
}
