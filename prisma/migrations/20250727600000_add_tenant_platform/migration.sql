-- Tenant Administration Platform permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'tenant_platform.view', 'View Tenant Platform', 'View tenant lifecycle, settings, and analytics', 'tenant_platform', NOW(), NOW()),
  (gen_random_uuid(), 'tenant_platform.manage', 'Manage Tenant Platform', 'Manage tenant lifecycle, limits, and policies', 'tenant_platform', NOW(), NOW()),
  (gen_random_uuid(), 'tenant_platform.admin', 'Administer Tenant Platform', 'Full tenant platform administration', 'tenant_platform', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "TenantLifecycleStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "TenantHealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TenantAuditEventType" AS ENUM ('TENANT_CREATED', 'TENANT_SUSPENDED', 'TENANT_REACTIVATED', 'TENANT_ARCHIVED', 'TENANT_DELETED', 'PROFILE_UPDATED', 'BRANCH_UPDATED', 'SUBSCRIPTION_ASSIGNED', 'FEATURE_ASSIGNED', 'LIMIT_UPDATED', 'SETTINGS_UPDATED', 'MAINTENANCE_ENABLED', 'MAINTENANCE_DISABLED', 'IMPERSONATION_STARTED', 'IMPERSONATION_ENDED', 'POLICY_UPDATED', 'HEALTH_CHECK', 'ACTIVITY_RECORDED', 'DASHBOARD_ACCESS', 'NOTIFICATION_SENT');

-- CreateTable
CREATE TABLE "tenant_records" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "lifecycle_status" "TenantLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "health_status" "TenantHealthStatus" NOT NULL DEFAULT 'HEALTHY',
    "subscription_plan" TEXT,
    "subscription_status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "assigned_features" JSONB NOT NULL DEFAULT '[]',
    "branch_count" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMP(3),
    "suspended_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_settings" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "display_name" TEXT,
    "support_email" TEXT,
    "billing_email" TEXT,
    "default_timezone" TEXT NOT NULL DEFAULT 'UTC',
    "default_locale" TEXT NOT NULL DEFAULT 'en',
    "compliance_mode" TEXT NOT NULL DEFAULT 'standard',
    "custom_settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_resource_limits" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "max_users" INTEGER NOT NULL DEFAULT 50,
    "max_branches" INTEGER NOT NULL DEFAULT 5,
    "max_storage_bytes" BIGINT NOT NULL DEFAULT 10737418240,
    "max_api_calls_per_month" INTEGER NOT NULL DEFAULT 100000,
    "max_ai_tokens_per_month" INTEGER NOT NULL DEFAULT 500000,
    "max_database_rows" INTEGER NOT NULL DEFAULT 1000000,
    "max_marketplace_licenses" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_resource_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_resource_usage" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "storage_used_bytes" BIGINT NOT NULL DEFAULT 0,
    "api_calls_this_month" INTEGER NOT NULL DEFAULT 0,
    "ai_tokens_this_month" INTEGER NOT NULL DEFAULT 0,
    "database_rows" INTEGER NOT NULL DEFAULT 0,
    "marketplace_licenses" INTEGER NOT NULL DEFAULT 0,
    "last_calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_resource_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_policies" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "policy_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "rules" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_activity_events" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_impersonation_sessions" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "target_user_id" TEXT,
    "reason" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_impersonation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_platform_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "user_id" TEXT,
    "event_type" "TenantAuditEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_records_business_id_key" ON "tenant_records"("business_id");

-- CreateIndex
CREATE INDEX "tenant_records_lifecycle_status_health_status_idx" ON "tenant_records"("lifecycle_status", "health_status");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_business_id_key" ON "tenant_settings"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_resource_limits_business_id_key" ON "tenant_resource_limits"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_resource_usage_business_id_key" ON "tenant_resource_usage"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_policies_business_id_policy_key_key" ON "tenant_policies"("business_id", "policy_key");

-- CreateIndex
CREATE INDEX "tenant_policies_module_idx" ON "tenant_policies"("module");

-- CreateIndex
CREATE INDEX "tenant_activity_events_business_id_created_at_idx" ON "tenant_activity_events"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "tenant_impersonation_sessions_business_id_is_active_idx" ON "tenant_impersonation_sessions"("business_id", "is_active");

-- CreateIndex
CREATE INDEX "tenant_platform_audit_logs_business_id_event_type_created_at_idx" ON "tenant_platform_audit_logs"("business_id", "event_type", "created_at");

-- AddForeignKey
ALTER TABLE "tenant_records" ADD CONSTRAINT "tenant_records_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_resource_limits" ADD CONSTRAINT "tenant_resource_limits_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_resource_usage" ADD CONSTRAINT "tenant_resource_usage_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_policies" ADD CONSTRAINT "tenant_policies_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_activity_events" ADD CONSTRAINT "tenant_activity_events_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_activity_events" ADD CONSTRAINT "tenant_activity_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_impersonation_sessions" ADD CONSTRAINT "tenant_impersonation_sessions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_impersonation_sessions" ADD CONSTRAINT "tenant_impersonation_sessions_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_platform_audit_logs" ADD CONSTRAINT "tenant_platform_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_platform_audit_logs" ADD CONSTRAINT "tenant_platform_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
