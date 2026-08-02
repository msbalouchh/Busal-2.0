import type {
  PlatformCloudSubscriptionPlan,
  PlatformCloudTenant,
  PlatformCloudTenantFeatureFlag,
  PlatformCloudTenantSubscription,
} from "@prisma/client";

import type {
  CloudSettingsRecord,
  CloudSummaryRecord,
  CloudTenantRecord,
  FeatureFlagRecord,
  LicenseRecord,
  QuotaRecord,
  SubscriptionPlanRecord,
  SubscriptionRecord,
  UsageMetricRecord,
} from "@/modules/cloud-platform-management/types/cloud-platform-types";
import type { getCloudDashboardOverview } from "@/services/platform-provisioning.service";
import type { getLicenseInfo } from "@/services/license-manager.service";

export function serializeCloudTenant(
  tenant: PlatformCloudTenant & { plan?: { name: string } | null },
): CloudTenantRecord {
  return {
    id: tenant.id,
    tenantKey: tenant.tenantKey,
    status: tenant.status,
    region: tenant.region,
    planName: tenant.plan?.name ?? null,
    createdAt: tenant.createdAt.toISOString(),
  };
}

export function serializeSubscriptionPlan(
  plan: PlatformCloudSubscriptionPlan,
): SubscriptionPlanRecord {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    price: plan.price,
    billingCycle: plan.billingCycle,
    status: plan.status,
  };
}

export function serializeSubscription(
  sub: PlatformCloudTenantSubscription & { plan: { name: string } },
): SubscriptionRecord {
  return {
    id: sub.id,
    planName: sub.plan.name,
    status: sub.status,
    startedAt: sub.startedAt.toISOString(),
    expiresAt: sub.expiresAt?.toISOString() ?? null,
    renewalDate: sub.renewalDate?.toISOString() ?? null,
  };
}

export function serializeFeatureFlag(flag: PlatformCloudTenantFeatureFlag): FeatureFlagRecord {
  return { id: flag.id, key: flag.key, enabled: flag.enabled };
}

export function serializeUsageMetric(metric: {
  resource: string;
  value: number;
  limit: number;
  utilization: number;
  period: string;
}): UsageMetricRecord {
  return {
    resource: metric.resource,
    value: metric.value,
    limit: metric.limit,
    utilization: metric.utilization,
    period: metric.period,
  };
}

export function serializeQuota(quota: QuotaRecord): QuotaRecord {
  return quota;
}

export function serializeLicense(
  license: Awaited<ReturnType<typeof getLicenseInfo>>,
): LicenseRecord {
  return {
    valid: license.valid,
    licenseKey: license.licenseKey,
    planSlug: license.planSlug,
    subscriptionStatus: license.subscriptionStatus,
    expiresAt: license.expiresAt,
  };
}

export function serializeCloudSummary(
  overview: Awaited<ReturnType<typeof getCloudDashboardOverview>>,
): CloudSummaryRecord {
  return {
    tenantKey: overview.tenant.tenantKey,
    tenantStatus: overview.tenant.status,
    healthy: overview.health.healthy,
    planName: overview.subscription?.plan.name ?? null,
    subscriptionStatus: overview.subscription?.status ?? null,
    enabledFlags: overview.enabledFlags,
    totalFlags: overview.totalFlags,
    region: overview.region,
    licenseValid: overview.license.valid,
  };
}

export function serializeCloudSettings(input: {
  tenantKey: string;
  status: PlatformCloudTenant["status"];
  region: string;
}): CloudSettingsRecord {
  return input;
}
