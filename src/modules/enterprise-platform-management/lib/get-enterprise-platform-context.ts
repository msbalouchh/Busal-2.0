import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import { ENTERPRISE_PLATFORM_ROUTES } from "@/modules/enterprise-platform-management/constants/routes";
import {
  serializeComplianceSummary,
  serializeEnterpriseAudit,
  serializeEnterprisePolicy,
  serializeEnterpriseSummary,
  serializeIdentityProvider,
  serializeOrganization,
  serializeOrganizationSettings,
  serializeOrganizationUnit,
} from "@/modules/enterprise-platform-management/lib/enterprise-platform-validation";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getEnterpriseDashboardOverview,
  searchEnterprise,
} from "@/services/enterprise-platform-manager.service";
import { resolveEnterprisePlatformPermissions } from "@/services/enterprise-platform-permission.service";
import { listOrganizations, getOrganization } from "@/services/organization-manager.service";
import { listAllDepartments } from "@/services/organization-hierarchy.service";
import { listIdentityProviders } from "@/services/identity-provider-manager.service";
import { listEnterprisePolicies } from "@/services/enterprise-policy-manager.service";
import { getComplianceDashboard } from "@/services/compliance-manager.service";
import { listEnterpriseAuditLogs } from "@/services/enterprise-audit.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface EnterprisePlatformContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveEnterprisePlatformPermissions>;
}

async function resolveEnterpriseBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getEnterprisePlatformContext = cache(async (): Promise<EnterprisePlatformContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveEnterpriseBusiness(user);
  const permissionsFlags = resolveEnterprisePlatformPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  if (!permissionsFlags.canView) redirect(ROUTES.application);

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
});

export async function requireEnterprisePlatformActionContext(
  permission: string,
): Promise<EnterprisePlatformContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveEnterpriseBusiness(user);
  const permissionsFlags = resolveEnterprisePlatformPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  const allowed = loaded.authorization.isOwner || loaded.authorization.permissions.has(permission);
  if (!allowed) throw permissionDenied();

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
}

export const getEnterpriseDashboardContext = cache(async () => {
  const context = await getEnterprisePlatformContext();
  const overview = await getEnterpriseDashboardOverview(context.user.id);
  const organizations = await listOrganizations(context.user.id);
  return {
    ...context,
    summary: serializeEnterpriseSummary(overview),
    organizations: organizations.map(serializeOrganization),
    recentAudit: (await listEnterpriseAuditLogs(context.user.id, { limit: 5 })).map(
      serializeEnterpriseAudit,
    ),
  };
});

export const getEnterpriseOrganizationsContext = cache(async () => {
  const context = await getEnterprisePlatformContext();
  const organizations = await listOrganizations(context.user.id);
  return { ...context, organizations: organizations.map(serializeOrganization) };
});

export const getEnterpriseDepartmentsContext = cache(async () => {
  const context = await getEnterprisePlatformContext();
  const [departments, organizations] = await Promise.all([
    listAllDepartments(context.user.id),
    listOrganizations(context.user.id),
  ]);
  return {
    ...context,
    departments: departments.map(serializeOrganizationUnit),
    organizations: organizations.map(serializeOrganization),
  };
});

export const getEnterpriseIdentityProvidersContext = cache(async () => {
  const context = await getEnterprisePlatformContext();
  const [providers, organizations] = await Promise.all([
    listIdentityProviders(context.user.id),
    listOrganizations(context.user.id),
  ]);
  return {
    ...context,
    providers: providers.map(serializeIdentityProvider),
    organizations: organizations.map(serializeOrganization),
  };
});

export const getEnterprisePoliciesContext = cache(async () => {
  const context = await getEnterprisePlatformContext();
  const [policies, organizations] = await Promise.all([
    listEnterprisePolicies(context.user.id),
    listOrganizations(context.user.id),
  ]);
  return {
    ...context,
    policies: policies.map(serializeEnterprisePolicy),
    organizations: organizations.map(serializeOrganization),
  };
});

export const getEnterpriseComplianceContext = cache(async () => {
  const context = await getEnterprisePlatformContext();
  const compliance = await getComplianceDashboard(context.user.id);
  const audit = await listEnterpriseAuditLogs(context.user.id, { limit: 10 });
  return {
    ...context,
    compliance: serializeComplianceSummary(compliance),
    audit: audit.map(serializeEnterpriseAudit),
  };
});

export const getEnterpriseSettingsContext = cache(async (organizationId: string) => {
  const context = await getEnterprisePlatformContext();
  const org = await getOrganization(context.user.id, organizationId);
  if (!org) redirect(ENTERPRISE_PLATFORM_ROUTES.organizations());
  return {
    ...context,
    settings: serializeOrganizationSettings(org),
  };
});

export const getEnterpriseSearchContext = cache(async (query?: string) => {
  const context = await getEnterprisePlatformContext();
  const trimmed = query?.trim() ?? "";
  if (!trimmed) return { ...context, search: "", organizations: [] };
  const results = await searchEnterprise(context.user.id, trimmed);
  return {
    ...context,
    search: trimmed,
    organizations: results.organizations.map(serializeOrganization),
  };
});
