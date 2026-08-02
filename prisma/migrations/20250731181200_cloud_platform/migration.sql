-- Busal Cloud & SaaS Platform

CREATE TYPE "PlatformCloudTenantStatus" AS ENUM ('ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED');
CREATE TYPE "PlatformCloudSubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELLED');
CREATE TYPE "PlatformCloudBillingCycle" AS ENUM ('MONTHLY', 'YEARLY', 'LIFETIME');
CREATE TYPE "PlatformCloudPlanStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

CREATE TABLE "platform_cloud_subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billing_cycle" "PlatformCloudBillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "features" JSONB NOT NULL DEFAULT '[]',
    "limits" JSONB NOT NULL DEFAULT '{}',
    "status" "PlatformCloudPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_cloud_subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_cloud_tenants" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "tenant_key" TEXT NOT NULL,
    "status" "PlatformCloudTenantStatus" NOT NULL DEFAULT 'TRIAL',
    "subscription_id" TEXT,
    "plan_id" TEXT,
    "region" TEXT NOT NULL DEFAULT 'eu-west-1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_cloud_tenants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_cloud_tenant_subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "PlatformCloudSubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "renewal_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_cloud_tenant_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_cloud_tenant_feature_flags" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_cloud_tenant_feature_flags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_cloud_usage_metrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "limit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_cloud_usage_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_cloud_subscription_plans_slug_key" ON "platform_cloud_subscription_plans"("slug");
CREATE UNIQUE INDEX "platform_cloud_tenants_tenant_key_key" ON "platform_cloud_tenants"("tenant_key");
CREATE UNIQUE INDEX "platform_cloud_tenants_business_id_key" ON "platform_cloud_tenants"("business_id");
CREATE INDEX "platform_cloud_tenants_status_region_idx" ON "platform_cloud_tenants"("status", "region");
CREATE INDEX "platform_cloud_tenant_subscriptions_tenant_id_status_idx" ON "platform_cloud_tenant_subscriptions"("tenant_id", "status");
CREATE UNIQUE INDEX "platform_cloud_tenant_feature_flags_tenant_id_key_key" ON "platform_cloud_tenant_feature_flags"("tenant_id", "key");
CREATE INDEX "platform_cloud_tenant_feature_flags_tenant_id_enabled_idx" ON "platform_cloud_tenant_feature_flags"("tenant_id", "enabled");
CREATE INDEX "platform_cloud_usage_metrics_tenant_id_resource_recorded_at_idx" ON "platform_cloud_usage_metrics"("tenant_id", "resource", "recorded_at");

ALTER TABLE "platform_cloud_tenants" ADD CONSTRAINT "platform_cloud_tenants_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_cloud_tenants" ADD CONSTRAINT "platform_cloud_tenants_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "platform_cloud_subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform_cloud_tenant_subscriptions" ADD CONSTRAINT "platform_cloud_tenant_subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_cloud_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_cloud_tenant_subscriptions" ADD CONSTRAINT "platform_cloud_tenant_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "platform_cloud_subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "platform_cloud_tenant_feature_flags" ADD CONSTRAINT "platform_cloud_tenant_feature_flags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_cloud_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_cloud_usage_metrics" ADD CONSTRAINT "platform_cloud_usage_metrics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_cloud_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
