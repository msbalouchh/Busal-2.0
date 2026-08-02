import "server-only";

import { ensureDefaultSubscriptionPlans } from "@/services/plan-manager.service";
import { provisionTenant, getTenantHealth } from "@/services/tenant-provisioning.service";
import {
  listTenantSubscriptions,
  getActiveSubscription,
} from "@/services/subscription-manager.service";
import { listSubscriptionPlans } from "@/services/plan-manager.service";
import { getUsageSummary, ensureDefaultUsageMetrics } from "@/services/usage-metering.service";
import { getLicenseInfo } from "@/services/license-manager.service";
import { listTenantFeatureFlags } from "@/services/cloud-feature-flag-manager.service";
import { getQuotaDashboard } from "@/services/quota-manager.service";
import { getTenantRegion } from "@/services/region-manager.service";

export async function ensureCloudPlatformSeed(ownerId: string) {
  await ensureDefaultSubscriptionPlans();
  await provisionTenant(ownerId);
  await ensureDefaultUsageMetrics(ownerId);
}

export async function getCloudDashboardOverview(ownerId: string) {
  await ensureCloudPlatformSeed(ownerId);
  const [tenant, health, subscription, plans, usage, license, flags, quotas, region] =
    await Promise.all([
      provisionTenant(ownerId),
      getTenantHealth(ownerId),
      getActiveSubscription(ownerId),
      listSubscriptionPlans(),
      getUsageSummary(ownerId),
      getLicenseInfo(ownerId),
      listTenantFeatureFlags(ownerId),
      getQuotaDashboard(ownerId),
      getTenantRegion(ownerId),
    ]);

  return {
    tenant,
    health,
    subscription,
    planCount: plans.length,
    usage,
    license,
    enabledFlags: flags.filter((f) => f.enabled).length,
    totalFlags: flags.length,
    quotas,
    region,
  };
}

export async function getCloudPlatformSettings(ownerId: string) {
  const tenant = await provisionTenant(ownerId);
  const region = await getTenantRegion(ownerId);
  return {
    tenantKey: tenant.tenantKey,
    status: tenant.status,
    region: region ?? tenant.region,
  };
}

export { listTenantSubscriptions };
