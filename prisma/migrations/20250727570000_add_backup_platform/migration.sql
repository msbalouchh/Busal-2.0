-- Backup Platform permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'backup_platform.view', 'View Backup Platform', 'View backups, recovery jobs, and DR plans', 'backup_platform', NOW(), NOW()),
  (gen_random_uuid(), 'backup_platform.manage', 'Manage Backup Platform', 'Create backups and manage recovery jobs', 'backup_platform', NOW(), NOW()),
  (gen_random_uuid(), 'backup_platform.admin', 'Administer Backup Platform', 'Full backup and disaster recovery administration', 'backup_platform', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "BackupTriggerType" AS ENUM ('AUTOMATED', 'MANUAL');

-- CreateEnum
CREATE TYPE "BackupScope" AS ENUM ('TENANT', 'BUSINESS', 'BRANCH', 'DATABASE', 'FILE', 'CONFIGURATION');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "RecoveryJobType" AS ENUM ('PITR', 'TENANT_RESTORE', 'BUSINESS_RESTORE', 'BRANCH_RESTORE', 'PREVIEW');

-- CreateEnum
CREATE TYPE "RecoveryJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BackupAuditEventType" AS ENUM ('BACKUP_CREATED', 'BACKUP_VERIFIED', 'BACKUP_FAILED', 'RECOVERY_STARTED', 'RECOVERY_COMPLETED', 'RECOVERY_FAILED', 'POLICY_REGISTERED', 'RETENTION_APPLIED', 'DR_PLAN_UPDATED', 'NOTIFICATION_SENT', 'DASHBOARD_ACCESS');

-- CreateTable
CREATE TABLE "backup_policies" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "policy_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "scope" "BackupScope" NOT NULL,
    "schedule_cron" TEXT,
    "retention_days" INTEGER NOT NULL DEFAULT 30,
    "encryption_key_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_records" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "policy_id" TEXT,
    "backup_key" TEXT NOT NULL,
    "trigger_type" "BackupTriggerType" NOT NULL,
    "scope" "BackupScope" NOT NULL,
    "branch_id" TEXT,
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "size_bytes" BIGINT NOT NULL DEFAULT 0,
    "checksum" TEXT,
    "encryption_key_id" TEXT,
    "storage_path" TEXT,
    "pitr_timestamp" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_retention_policies" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "name" TEXT NOT NULL,
    "retention_days" INTEGER NOT NULL DEFAULT 30,
    "archive_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disaster_recovery_plans" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "rto_minutes" INTEGER NOT NULL DEFAULT 60,
    "rpo_minutes" INTEGER NOT NULL DEFAULT 15,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disaster_recovery_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_jobs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "backup_id" TEXT,
    "user_id" TEXT,
    "job_type" "RecoveryJobType" NOT NULL,
    "status" "RecoveryJobStatus" NOT NULL DEFAULT 'PENDING',
    "progress_pct" INTEGER NOT NULL DEFAULT 0,
    "branch_id" TEXT,
    "pitr_timestamp" TIMESTAMP(3),
    "preview_data" JSONB,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recovery_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_platform_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "user_id" TEXT,
    "event_type" "BackupAuditEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "backup_policies_business_id_policy_key_key" ON "backup_policies"("business_id", "policy_key");

-- CreateIndex
CREATE INDEX "backup_policies_business_id_scope_idx" ON "backup_policies"("business_id", "scope");

-- CreateIndex
CREATE INDEX "backup_records_business_id_scope_created_at_idx" ON "backup_records"("business_id", "scope", "created_at");

-- CreateIndex
CREATE INDEX "backup_records_business_id_status_idx" ON "backup_records"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "backup_retention_policies_business_id_name_key" ON "backup_retention_policies"("business_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "disaster_recovery_plans_business_id_name_key" ON "disaster_recovery_plans"("business_id", "name");

-- CreateIndex
CREATE INDEX "recovery_jobs_business_id_status_created_at_idx" ON "recovery_jobs"("business_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "backup_platform_audit_logs_business_id_event_type_created_at_idx" ON "backup_platform_audit_logs"("business_id", "event_type", "created_at");

-- AddForeignKey
ALTER TABLE "backup_policies" ADD CONSTRAINT "backup_policies_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_records" ADD CONSTRAINT "backup_records_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_records" ADD CONSTRAINT "backup_records_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "backup_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_retention_policies" ADD CONSTRAINT "backup_retention_policies_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disaster_recovery_plans" ADD CONSTRAINT "disaster_recovery_plans_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_jobs" ADD CONSTRAINT "recovery_jobs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_jobs" ADD CONSTRAINT "recovery_jobs_backup_id_fkey" FOREIGN KEY ("backup_id") REFERENCES "backup_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_jobs" ADD CONSTRAINT "recovery_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_platform_audit_logs" ADD CONSTRAINT "backup_platform_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_platform_audit_logs" ADD CONSTRAINT "backup_platform_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
