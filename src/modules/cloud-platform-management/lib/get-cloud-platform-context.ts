import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import {
  serializeCloudSettings,
  serializeCloudSummary,
  serializeCloudTenant,
  serializeFeatureFlag,
  serializeLicense,
  serializeQuota,
  serializeSubscription,
  serializeSubscriptionPlan,
  serializeUsageMetric,
} from "@/modules/cloud-platform-management/lib/cloud-platform-validation";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { resolveCloudPlatformPermissions } from "@/services/cloud-platform-permission.service";
import {
  getCloudDashboardOverview,
  getCloudPlatformSettings,
  listTenantSubscriptions,
} from "@/services/platform-provisioning.service";
import { getCloudTenant, listCloudTenants } from "@/services/tenant-provisioning.service";
import { listSubscriptionPlans } from "@/services/plan-manager.service";
import { listTenantFeatureFlags } from "@/services/cloud-feature-flag-manager.service";
import { getUsageSummary } from "@/services/usage-metering.service";
import { getQuotaDashboard } from "@/services/quota-manager.service";
import { getLicenseInfo } from "@/services/license-manager.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface CloudPlatformContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveCloudPlatformPermissions>;
}

async function resolveCloudBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getCloudPlatformContext = cache(async (): Promise<CloudPlatformContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveCloudBusiness(user);
  const permissionsFlags = resolveCloudPlatformPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );
  if (!permissionsFlags.canView) redirect(ROUTES.application);
  return { user, business: loaded.business, authorization: loaded.authorization, permissionsFlags };
});

export async function requireCloudPlatformActionContext(
  permission: string,
): Promise<CloudPlatformContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();
  const loaded = await resolveCloudBusiness(user);
  const permissionsFlags = resolveCloudPlatformPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );
  const allowed = loaded.authorization.isOwner || loaded.authorization.permissions.has(permission);
  if (!allowed) throw permissionDenied();
  return { user, business: loaded.business, authorization: loaded.authorization, permissionsFlags };
}

export const getCloudDashboardContext = cache(async () => {
  const context = await getCloudPlatformContext();
  const overview = await getCloudDashboardOverview(context.user.id);
  return {
    ...context,
    summary: serializeCloudSummary(overview),
    usage: overview.usage.map(serializeUsageMetric),
  };
});

export const getCloudTenantsContext = cache(async () => {
  const context = await getCloudPlatformContext();
  const tenants = await listCloudTenants(context.user.id);
  return { ...context, tenants: tenants.map(serializeCloudTenant) };
});

export const getCloudSubscriptionsContext = cache(async () => {
  const context = await getCloudPlatformContext();
  const subscriptions = await listTenantSubscriptions(context.user.id);
  return { ...context, subscriptions: subscriptions.map(serializeSubscription) };
});

export const getCloudPlansContext = cache(async () => {
  const context = await getCloudPlatformContext();
  const plans = await listSubscriptionPlans();
  return { ...context, plans: plans.map(serializeSubscriptionPlan) };
});

export const getCloudFeatureFlagsContext = cache(async () => {
  const context = await getCloudPlatformContext();
  const flags = await listTenantFeatureFlags(context.user.id);
  return { ...context, flags: flags.map(serializeFeatureFlag) };
});

export const getCloudUsageContext = cache(async () => {
  const context = await getCloudPlatformContext();
  const usage = await getUsageSummary(context.user.id);
  return { ...context, usage: usage.map(serializeUsageMetric) };
});

export const getCloudQuotasContext = cache(async () => {
  const context = await getCloudPlatformContext();
  const quotas = await getQuotaDashboard(context.user.id);
  return { ...context, quotas: quotas.map(serializeQuota) };
});

export const getCloudLicensingContext = cache(async () => {
  const context = await getCloudPlatformContext();
  const license = await getLicenseInfo(context.user.id);
  const tenant = await getCloudTenant(context.user.id);
  return {
    ...context,
    license: serializeLicense(license),
    tenant: tenant ? serializeCloudTenant(tenant) : null,
  };
});

export const getCloudSettingsContext = cache(async () => {
  const context = await getCloudPlatformContext();
  const settings = await getCloudPlatformSettings(context.user.id);
  return { ...context, settings: serializeCloudSettings(settings) };
});
