-- Settings engine permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'settings.view', 'View Settings', 'View configuration settings and values', 'settings', NOW(), NOW()),
  (gen_random_uuid(), 'settings.edit', 'Edit Settings', 'Edit configuration values within assigned scope', 'settings', NOW(), NOW()),
  (gen_random_uuid(), 'settings.manage', 'Manage Settings', 'Manage settings definitions and scoped overrides', 'settings', NOW(), NOW()),
  (gen_random_uuid(), 'settings.admin', 'Administer Settings', 'Full settings engine administration', 'settings', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "ConfigScope" AS ENUM ('PLATFORM', 'TENANT', 'BUSINESS', 'BRANCH', 'DEPARTMENT', 'ROLE', 'USER', 'MODULE');

-- CreateEnum
CREATE TYPE "ConfigValueType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'TIME', 'JSON', 'ENUM', 'ARRAY', 'SECRET');

-- CreateEnum
CREATE TYPE "ConfigEnvironment" AS ENUM ('DEVELOPMENT', 'STAGING', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "ConfigAuditEventType" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'RESTORED', 'IMPORTED', 'EXPORTED');

-- CreateTable
CREATE TABLE "config_setting_definitions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value_type" "ConfigValueType" NOT NULL,
    "default_value" JSONB NOT NULL DEFAULT 'null',
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "validation_rules" JSONB,
    "allowed_values" JSONB,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "regex_pattern" TEXT,
    "help_text" TEXT,
    "supported_scopes" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_setting_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_setting_values" (
    "id" TEXT NOT NULL,
    "definition_key" TEXT NOT NULL,
    "scope" "ConfigScope" NOT NULL,
    "environment" "ConfigEnvironment" NOT NULL DEFAULT 'PRODUCTION',
    "scope_identifier" TEXT NOT NULL,
    "business_id" TEXT,
    "branch_id" TEXT,
    "department" TEXT,
    "role_slug" TEXT,
    "user_id" TEXT,
    "module_key" TEXT,
    "value" JSONB NOT NULL,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "change_reason" TEXT,
    "changed_by_id" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_setting_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_setting_versions" (
    "id" TEXT NOT NULL,
    "setting_value_id" TEXT NOT NULL,
    "business_id" TEXT,
    "version" INTEGER NOT NULL,
    "previous_value" JSONB NOT NULL,
    "changed_by_id" TEXT,
    "change_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "config_setting_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "user_id" TEXT,
    "event_type" "ConfigAuditEventType" NOT NULL,
    "definition_key" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "config_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "config_setting_definitions_key_key" ON "config_setting_definitions"("key");

-- CreateIndex
CREATE INDEX "config_setting_definitions_module_category_idx" ON "config_setting_definitions"("module", "category");

-- CreateIndex
CREATE UNIQUE INDEX "config_setting_values_definition_key_scope_environment_scope_identifier_key" ON "config_setting_values"("definition_key", "scope", "environment", "scope_identifier");

-- CreateIndex
CREATE INDEX "config_setting_values_business_id_scope_idx" ON "config_setting_values"("business_id", "scope");

-- CreateIndex
CREATE INDEX "config_setting_values_definition_key_scope_idx" ON "config_setting_values"("definition_key", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "config_setting_versions_setting_value_id_version_key" ON "config_setting_versions"("setting_value_id", "version");

-- CreateIndex
CREATE INDEX "config_setting_versions_business_id_created_at_idx" ON "config_setting_versions"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "config_audit_logs_business_id_event_type_created_at_idx" ON "config_audit_logs"("business_id", "event_type", "created_at");

-- AddForeignKey
ALTER TABLE "config_setting_values" ADD CONSTRAINT "config_setting_values_definition_key_fkey" FOREIGN KEY ("definition_key") REFERENCES "config_setting_definitions"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_setting_values" ADD CONSTRAINT "config_setting_values_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_setting_values" ADD CONSTRAINT "config_setting_values_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_setting_versions" ADD CONSTRAINT "config_setting_versions_setting_value_id_fkey" FOREIGN KEY ("setting_value_id") REFERENCES "config_setting_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_setting_versions" ADD CONSTRAINT "config_setting_versions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_setting_versions" ADD CONSTRAINT "config_setting_versions_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_audit_logs" ADD CONSTRAINT "config_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_audit_logs" ADD CONSTRAINT "config_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
