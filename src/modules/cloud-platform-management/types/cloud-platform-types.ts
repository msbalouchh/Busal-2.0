import type {
  PlatformCloudBillingCycle,
  PlatformCloudPlanStatus,
  PlatformCloudSubscriptionStatus,
  PlatformCloudTenantStatus,
} from "@prisma/client";

export interface CloudSummaryRecord {
  tenantKey: string;
  tenantStatus: PlatformCloudTenantStatus;
  healthy: boolean;
  planName: string | null;
  subscriptionStatus: PlatformCloudSubscriptionStatus | null;
  enabledFlags: number;
  totalFlags: number;
  region: string | null;
  licenseValid: boolean;
}

export interface CloudTenantRecord {
  id: string;
  tenantKey: string;
  status: PlatformCloudTenantStatus;
  region: string;
  planName: string | null;
  createdAt: string;
}

export interface SubscriptionPlanRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billingCycle: PlatformCloudBillingCycle;
  status: PlatformCloudPlanStatus;
}

export interface SubscriptionRecord {
  id: string;
  planName: string;
  status: PlatformCloudSubscriptionStatus;
  startedAt: string;
  expiresAt: string | null;
  renewalDate: string | null;
}

export interface FeatureFlagRecord {
  id: string;
  key: string;
  enabled: boolean;
}

export interface UsageMetricRecord {
  resource: string;
  value: number;
  limit: number;
  utilization: number;
  period: string;
}

export interface QuotaRecord {
  resource: string;
  value: number;
  limit: number;
  utilization: number;
  status: string;
}

export interface LicenseRecord {
  valid: boolean;
  licenseKey: string;
  planSlug: string | null;
  subscriptionStatus: PlatformCloudSubscriptionStatus | null;
  expiresAt: string | null;
}

export interface CloudSettingsRecord {
  tenantKey: string;
  status: PlatformCloudTenantStatus;
  region: string;
}
