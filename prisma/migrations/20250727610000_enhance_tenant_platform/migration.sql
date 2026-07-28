-- Enhance Tenant Administration Platform

-- Add PENDING lifecycle status
ALTER TYPE "TenantLifecycleStatus" ADD VALUE IF NOT EXISTS 'PENDING';

-- CreateEnum
CREATE TYPE "TenantMaintenanceMode" AS ENUM ('NONE', 'READ_ONLY', 'FULL_LOCK', 'SCHEDULED');

-- Add new audit event types
ALTER TYPE "TenantAuditEventType" ADD VALUE IF NOT EXISTS 'TENANT_ACTIVATED';
ALTER TYPE "TenantAuditEventType" ADD VALUE IF NOT EXISTS 'RESOURCE_UPDATED';
ALTER TYPE "TenantAuditEventType" ADD VALUE IF NOT EXISTS 'MAINTENANCE_UPDATED';

-- Migrate maintenance mode from boolean to enum
ALTER TABLE "tenant_records" ADD COLUMN "maintenance_mode_new" "TenantMaintenanceMode" NOT NULL DEFAULT 'NONE';
ALTER TABLE "tenant_records" ADD COLUMN "scheduled_maintenance_at" TIMESTAMP(3);

UPDATE "tenant_records" SET "maintenance_mode_new" = 'FULL_LOCK' WHERE "maintenance_mode" = true;

ALTER TABLE "tenant_records" DROP COLUMN "maintenance_mode";
ALTER TABLE "tenant_records" RENAME COLUMN "maintenance_mode_new" TO "maintenance_mode";

-- Extend resource usage tracking
ALTER TABLE "tenant_resource_usage" ADD COLUMN IF NOT EXISTS "file_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tenant_resource_usage" ADD COLUMN IF NOT EXISTS "workflow_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tenant_resource_usage" ADD COLUMN IF NOT EXISTS "login_activity_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tenant_resource_usage" ADD COLUMN IF NOT EXISTS "module_usage" JSONB NOT NULL DEFAULT '{}';
