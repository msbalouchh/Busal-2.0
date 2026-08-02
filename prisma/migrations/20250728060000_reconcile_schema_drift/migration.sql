-- Reconcile database schema with Prisma datamodel (idempotent).
-- Adds columns/tables/indexes that exist in schema but were missing from the database.

DO $$ BEGIN CREATE TYPE "BusinessMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BusinessMemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BusinessModuleStatus" AS ENUM ('AVAILABLE', 'INSTALLED', 'ENABLED', 'DISABLED', 'DEPRECATED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BranchType" AS ENUM ('RESTAURANT', 'SALON', 'CLINIC', 'RETAIL', 'WAREHOUSE', 'OFFICE', 'HOTEL', 'GYM', 'PHARMACY', 'SERVICE_AREA', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'ARCHIVED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'INVITATION_RESENT';
ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'INVITATION_CANCELLED';
ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'ROLE_CHANGED';
ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'BRANCH_CHANGED';
ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'PERMISSION_CHANGED';
ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'ACTIVATED';
ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'DEACTIVATED';
ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'LOCKED';
ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'SUSPENDED';
ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'REACTIVATED';
ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET';
ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'LOGIN';
ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'BULK_UPDATE';
ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'ARCHIVED';
ALTER TYPE "StaffAuditEventType" ADD VALUE IF NOT EXISTS 'DUPLICATE';

DROP INDEX IF EXISTS "categories_business_id_branch_id_idx";
DROP INDEX IF EXISTS "kitchen_queue_business_id_branch_id_idx";
DROP INDEX IF EXISTS "menu_items_business_id_branch_id_idx";
DROP INDEX IF EXISTS "orders_business_id_branch_id_idx";
DROP INDEX IF EXISTS "payments_business_id_branch_id_idx";
DROP INDEX IF EXISTS "tables_business_id_branch_id_idx";

ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "address_line1" TEXT;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "address_line2" TEXT;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "county" TEXT;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "cover_image" TEXT;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "currency" TEXT;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10,7);
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "logo" TEXT;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(10,7);
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "opening_hours" JSONB DEFAULT '{}';
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "postcode" TEXT;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "tax_number" TEXT;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "timezone" TEXT;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "type" "BranchType" NOT NULL DEFAULT 'OTHER';
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "website" TEXT;

ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "business_code" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "business_email" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "business_setup_completed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "business_setup_step" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'GBP';
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "industry" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "phone" TEXT;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;

CREATE TABLE IF NOT EXISTS "business_members" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "BusinessMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "BusinessMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "business_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "business_member_roles" (
    "id" TEXT NOT NULL,
    "business_member_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "business_member_roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "business_modules" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "status" "BusinessModuleStatus" NOT NULL DEFAULT 'INSTALLED',
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "installed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "business_modules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "module_configurations" (
    "id" TEXT NOT NULL,
    "business_module_id" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "module_configurations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "business_code_sequences" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "business_code_sequences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "branch_settings" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "branch_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reporting_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reporting_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "business_members_user_id_status_idx" ON "business_members"("user_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "business_members_business_id_user_id_key" ON "business_members"("business_id", "user_id");
CREATE INDEX IF NOT EXISTS "business_member_roles_role_id_idx" ON "business_member_roles"("role_id");
CREATE UNIQUE INDEX IF NOT EXISTS "business_member_roles_business_member_id_role_id_key" ON "business_member_roles"("business_member_id", "role_id");
CREATE INDEX IF NOT EXISTS "business_modules_business_id_is_enabled_idx" ON "business_modules"("business_id", "is_enabled");
CREATE UNIQUE INDEX IF NOT EXISTS "business_modules_business_id_module_key_key" ON "business_modules"("business_id", "module_key");
CREATE UNIQUE INDEX IF NOT EXISTS "module_configurations_business_module_id_key" ON "module_configurations"("business_module_id");
CREATE UNIQUE INDEX IF NOT EXISTS "branch_settings_branch_id_key" ON "branch_settings"("branch_id");
CREATE INDEX IF NOT EXISTS "branches_business_id_status_idx" ON "branches"("business_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "branches_business_id_code_key" ON "branches"("business_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "businesses_business_code_key" ON "businesses"("business_code");
CREATE INDEX IF NOT EXISTS "staff_audit_logs_business_id_created_at_idx" ON "staff_audit_logs"("business_id", "created_at");
CREATE INDEX IF NOT EXISTS "staff_audit_logs_staff_id_event_type_idx" ON "staff_audit_logs"("staff_id", "event_type");
CREATE INDEX IF NOT EXISTS "staff_invitations_business_id_status_idx" ON "staff_invitations"("business_id", "status");
CREATE INDEX IF NOT EXISTS "staff_invitations_business_id_email_idx" ON "staff_invitations"("business_id", "email");

-- Clean orphaned references before adding foreign keys.
UPDATE "staff_audit_logs" SET "staff_id" = NULL
WHERE "staff_id" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "staff" s WHERE s."id" = "staff_audit_logs"."staff_id");

UPDATE "reporting_audit_logs" SET "staff_id" = NULL
WHERE "staff_id" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "staff" s WHERE s."id" = "reporting_audit_logs"."staff_id");

DO $$ BEGIN ALTER TABLE "business_members" ADD CONSTRAINT "business_members_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "business_members" ADD CONSTRAINT "business_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "business_member_roles" ADD CONSTRAINT "business_member_roles_business_member_id_fkey" FOREIGN KEY ("business_member_id") REFERENCES "business_members"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "business_member_roles" ADD CONSTRAINT "business_member_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "business_modules" ADD CONSTRAINT "business_modules_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "module_configurations" ADD CONSTRAINT "module_configurations_business_module_id_fkey" FOREIGN KEY ("business_module_id") REFERENCES "business_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "branch_settings" ADD CONSTRAINT "branch_settings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "staff_branch_assignments" ADD CONSTRAINT "staff_branch_assignments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "staff_branch_assignments" ADD CONSTRAINT "staff_branch_assignments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "staff_audit_logs" ADD CONSTRAINT "staff_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "staff_audit_logs" ADD CONSTRAINT "staff_audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "reporting_audit_logs" ADD CONSTRAINT "reporting_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "reporting_audit_logs" ADD CONSTRAINT "reporting_audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "knowledge_document_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "automation_workflows" ADD CONSTRAINT "automation_workflows_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "automation_workflow_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "ai_agent_memories" ADD CONSTRAINT "ai_agent_memories_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "platform_file_folders" ADD CONSTRAINT "platform_file_folders_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
