-- Feature flag platform permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'feature_flags.view', 'View Feature Flags', 'View feature flags and rollout status', 'feature_flags', NOW(), NOW()),
  (gen_random_uuid(), 'feature_flags.evaluate', 'Evaluate Feature Flags', 'Evaluate feature availability', 'feature_flags', NOW(), NOW()),
  (gen_random_uuid(), 'feature_flags.manage', 'Manage Feature Flags', 'Create and manage feature flags and rollouts', 'feature_flags', NOW(), NOW()),
  (gen_random_uuid(), 'feature_flags.admin', 'Administer Feature Flags', 'Full feature flag platform administration', 'feature_flags', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "FeatureFlagType" AS ENUM ('BOOLEAN', 'PERCENTAGE_ROLLOUT', 'SCHEDULED_ACTIVATION', 'SCHEDULED_DEACTIVATION', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "FeatureFlagStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SCHEDULED', 'ARCHIVED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "FeatureFlagTargetType" AS ENUM ('PLATFORM', 'TENANT', 'BUSINESS', 'BRANCH', 'DEPARTMENT', 'ROLE', 'USER', 'SUBSCRIPTION_PLAN', 'MARKETPLACE_LICENSE', 'COUNTRY', 'REGION', 'ENVIRONMENT');

-- CreateEnum
CREATE TYPE "FeatureFlagConditionType" AS ENUM ('DATE', 'TIME', 'USER_ATTRIBUTE', 'BUSINESS_ATTRIBUTE', 'CUSTOM_METADATA', 'MODULE', 'VERSION');

-- CreateEnum
CREATE TYPE "FeatureFlagAuditEventType" AS ENUM ('CREATED', 'UPDATED', 'ENABLED', 'DISABLED', 'SCHEDULED', 'DELETED', 'EVALUATED', 'ROLLBACK', 'CLONED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "module" TEXT NOT NULL,
    "flag_type" "FeatureFlagType" NOT NULL,
    "status" "FeatureFlagStatus" NOT NULL DEFAULT 'DRAFT',
    "default_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rollout_percentage" INTEGER NOT NULL DEFAULT 0,
    "scheduled_activate_at" TIMESTAMP(3),
    "scheduled_deactivate_at" TIMESTAMP(3),
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "change_reason" TEXT,
    "changed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flag_targets" (
    "id" TEXT NOT NULL,
    "flag_id" TEXT NOT NULL,
    "business_id" TEXT,
    "target_type" "FeatureFlagTargetType" NOT NULL,
    "target_value" TEXT NOT NULL,
    "is_included" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flag_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flag_versions" (
    "id" TEXT NOT NULL,
    "flag_id" TEXT NOT NULL,
    "business_id" TEXT,
    "version" INTEGER NOT NULL,
    "previous_config" JSONB NOT NULL,
    "change_reason" TEXT,
    "changed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flag_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flag_evaluation_logs" (
    "id" TEXT NOT NULL,
    "flag_id" TEXT NOT NULL,
    "business_id" TEXT,
    "user_id" TEXT,
    "flag_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "context" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flag_evaluation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flag_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "user_id" TEXT,
    "flag_id" TEXT,
    "flag_key" TEXT,
    "event_type" "FeatureFlagAuditEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flag_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_business_id_key_key" ON "feature_flags"("business_id", "key");

-- CreateIndex
CREATE INDEX "feature_flags_business_id_status_idx" ON "feature_flags"("business_id", "status");

-- CreateIndex
CREATE INDEX "feature_flags_module_status_idx" ON "feature_flags"("module", "status");

-- CreateIndex
CREATE INDEX "feature_flag_targets_flag_id_target_type_idx" ON "feature_flag_targets"("flag_id", "target_type");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flag_versions_flag_id_version_key" ON "feature_flag_versions"("flag_id", "version");

-- CreateIndex
CREATE INDEX "feature_flag_versions_business_id_created_at_idx" ON "feature_flag_versions"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "feature_flag_evaluation_logs_business_id_created_at_idx" ON "feature_flag_evaluation_logs"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "feature_flag_evaluation_logs_flag_id_created_at_idx" ON "feature_flag_evaluation_logs"("flag_id", "created_at");

-- CreateIndex
CREATE INDEX "feature_flag_audit_logs_business_id_event_type_created_at_idx" ON "feature_flag_audit_logs"("business_id", "event_type", "created_at");

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_targets" ADD CONSTRAINT "feature_flag_targets_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_targets" ADD CONSTRAINT "feature_flag_targets_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_versions" ADD CONSTRAINT "feature_flag_versions_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_versions" ADD CONSTRAINT "feature_flag_versions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_versions" ADD CONSTRAINT "feature_flag_versions_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_evaluation_logs" ADD CONSTRAINT "feature_flag_evaluation_logs_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_evaluation_logs" ADD CONSTRAINT "feature_flag_evaluation_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_evaluation_logs" ADD CONSTRAINT "feature_flag_evaluation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_audit_logs" ADD CONSTRAINT "feature_flag_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_audit_logs" ADD CONSTRAINT "feature_flag_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_audit_logs" ADD CONSTRAINT "feature_flag_audit_logs_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE SET NULL ON UPDATE CASCADE;
