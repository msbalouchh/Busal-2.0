-- File platform permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'files.view', 'View Files', 'View files and folders', 'files', NOW(), NOW()),
  (gen_random_uuid(), 'files.upload', 'Upload Files', 'Upload files to the platform', 'files', NOW(), NOW()),
  (gen_random_uuid(), 'files.download', 'Download Files', 'Download files from the platform', 'files', NOW(), NOW()),
  (gen_random_uuid(), 'files.edit', 'Edit Files', 'Edit file metadata and create versions', 'files', NOW(), NOW()),
  (gen_random_uuid(), 'files.delete', 'Delete Files', 'Soft delete and archive files', 'files', NOW(), NOW()),
  (gen_random_uuid(), 'files.share', 'Share Files', 'Create and manage file share links', 'files', NOW(), NOW()),
  (gen_random_uuid(), 'files.manage', 'Manage Files', 'Manage folders, retention, and permissions', 'files', NOW(), NOW()),
  (gen_random_uuid(), 'files.admin', 'Administer Files', 'Full file platform administration', 'files', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "FileStorageProvider" AS ENUM ('LOCAL', 'AWS_S3', 'AZURE_BLOB', 'GOOGLE_CLOUD', 'CLOUDFLARE_R2');

-- CreateEnum
CREATE TYPE "FileFolderType" AS ENUM ('PERSONAL', 'BUSINESS', 'DEPARTMENT', 'PROJECT', 'CUSTOMER', 'AI_KNOWLEDGE', 'MARKETPLACE_ASSETS', 'SHARED');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'SOFT_DELETED', 'PERMANENTLY_DELETED', 'LEGAL_HOLD');

-- CreateEnum
CREATE TYPE "FilePermissionLevel" AS ENUM ('VIEW', 'UPLOAD', 'DOWNLOAD', 'EDIT', 'DELETE', 'SHARE');

-- CreateEnum
CREATE TYPE "FilePermissionScope" AS ENUM ('OWNER', 'USER', 'TEAM', 'DEPARTMENT', 'ROLE', 'BUSINESS', 'BRANCH');

-- CreateEnum
CREATE TYPE "FileShareLinkType" AS ENUM ('INTERNAL', 'PUBLIC', 'EXPIRING');

-- CreateEnum
CREATE TYPE "FilePreviewType" AS ENUM ('PDF', 'IMAGE', 'OFFICE', 'TEXT', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "FileAiProcessingType" AS ENUM ('OCR', 'CLASSIFICATION', 'METADATA_EXTRACTION', 'SUMMARY', 'EMBEDDINGS');

-- CreateEnum
CREATE TYPE "FileAuditEventType" AS ENUM ('UPLOAD', 'DOWNLOAD', 'DELETE', 'RESTORE', 'SHARE', 'PERMISSION_CHANGE', 'PREVIEW', 'AI_PROCESSING', 'VERSION_RESTORE', 'ARCHIVE', 'PERMANENT_DELETE');

-- CreateEnum
CREATE TYPE "FileRetentionAction" AS ENUM ('ARCHIVE', 'SOFT_DELETE', 'PERMANENT_DELETE');

-- CreateTable
CREATE TABLE "platform_file_storage_configs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "provider" "FileStorageProvider" NOT NULL DEFAULT 'LOCAL',
    "name" TEXT NOT NULL,
    "config" JSONB,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_file_storage_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_file_folders" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "parent_id" TEXT,
    "folder_type" "FileFolderType" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "department" TEXT,
    "project_id" TEXT,
    "customer_id" TEXT,
    "owner_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_file_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_files" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "folder_id" TEXT,
    "owner_user_id" TEXT,
    "owner_staff_id" TEXT,
    "module" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "current_version_number" INTEGER NOT NULL DEFAULT 1,
    "status" "FileStatus" NOT NULL DEFAULT 'ACTIVE',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "storage_provider" "FileStorageProvider" NOT NULL DEFAULT 'LOCAL',
    "storage_key" TEXT NOT NULL,
    "preview_type" "FilePreviewType",
    "deleted_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "legal_hold_at" TIMESTAMP(3),
    "retention_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_file_versions" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "stored_name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "author_user_id" TEXT,
    "author_staff_id" TEXT,
    "change_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_file_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_file_permissions" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "scope" "FilePermissionScope" NOT NULL,
    "scope_ref" TEXT,
    "level" "FilePermissionLevel" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_file_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_file_share_links" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "link_type" "FileShareLinkType" NOT NULL,
    "token" TEXT NOT NULL,
    "password_hash" TEXT,
    "expires_at" TIMESTAMP(3),
    "download_limit" INTEGER,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_user_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_file_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_file_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "file_id" TEXT,
    "event_type" "FileAuditEventType" NOT NULL,
    "user_id" TEXT,
    "staff_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_file_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_file_retention_policies" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT,
    "retention_days" INTEGER NOT NULL,
    "action" "FileRetentionAction" NOT NULL DEFAULT 'ARCHIVE',
    "legal_hold_allowed" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_file_retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_file_ai_jobs" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "job_type" "FileAiProcessingType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "result" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "platform_file_ai_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_file_storage_configs_business_id_provider_key" ON "platform_file_storage_configs"("business_id", "provider");

-- CreateIndex
CREATE INDEX "platform_file_storage_configs_business_id_is_enabled_idx" ON "platform_file_storage_configs"("business_id", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "platform_file_folders_business_id_path_key" ON "platform_file_folders"("business_id", "path");

-- CreateIndex
CREATE INDEX "platform_file_folders_business_id_folder_type_idx" ON "platform_file_folders"("business_id", "folder_type");

-- CreateIndex
CREATE INDEX "platform_file_folders_parent_id_idx" ON "platform_file_folders"("parent_id");

-- CreateIndex
CREATE INDEX "platform_files_business_id_module_status_idx" ON "platform_files"("business_id", "module", "status");

-- CreateIndex
CREATE INDEX "platform_files_business_id_entity_type_entity_id_idx" ON "platform_files"("business_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "platform_files_folder_id_idx" ON "platform_files"("folder_id");

-- CreateIndex
CREATE INDEX "platform_files_checksum_idx" ON "platform_files"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "platform_file_versions_file_id_version_number_key" ON "platform_file_versions"("file_id", "version_number");

-- CreateIndex
CREATE INDEX "platform_file_versions_file_id_version_number_idx" ON "platform_file_versions"("file_id", "version_number");

-- CreateIndex
CREATE INDEX "platform_file_permissions_file_id_scope_level_idx" ON "platform_file_permissions"("file_id", "scope", "level");

-- CreateIndex
CREATE INDEX "platform_file_permissions_business_id_scope_ref_idx" ON "platform_file_permissions"("business_id", "scope_ref");

-- CreateIndex
CREATE UNIQUE INDEX "platform_file_share_links_token_key" ON "platform_file_share_links"("token");

-- CreateIndex
CREATE INDEX "platform_file_share_links_file_id_is_active_idx" ON "platform_file_share_links"("file_id", "is_active");

-- CreateIndex
CREATE INDEX "platform_file_share_links_business_id_link_type_idx" ON "platform_file_share_links"("business_id", "link_type");

-- CreateIndex
CREATE INDEX "platform_file_audit_logs_business_id_created_at_idx" ON "platform_file_audit_logs"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "platform_file_audit_logs_file_id_event_type_idx" ON "platform_file_audit_logs"("file_id", "event_type");

-- CreateIndex
CREATE INDEX "platform_file_retention_policies_business_id_module_is_active_idx" ON "platform_file_retention_policies"("business_id", "module", "is_active");

-- CreateIndex
CREATE INDEX "platform_file_ai_jobs_file_id_job_type_idx" ON "platform_file_ai_jobs"("file_id", "job_type");

-- CreateIndex
CREATE INDEX "platform_file_ai_jobs_business_id_status_idx" ON "platform_file_ai_jobs"("business_id", "status");

-- AddForeignKey
ALTER TABLE "platform_file_storage_configs" ADD CONSTRAINT "platform_file_storage_configs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_file_folders" ADD CONSTRAINT "platform_file_folders_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_file_folders" ADD CONSTRAINT "platform_file_folders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_file_folders" ADD CONSTRAINT "platform_file_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "platform_file_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_files" ADD CONSTRAINT "platform_files_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_files" ADD CONSTRAINT "platform_files_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_files" ADD CONSTRAINT "platform_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "platform_file_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_files" ADD CONSTRAINT "platform_files_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_files" ADD CONSTRAINT "platform_files_owner_staff_id_fkey" FOREIGN KEY ("owner_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_file_versions" ADD CONSTRAINT "platform_file_versions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "platform_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_file_versions" ADD CONSTRAINT "platform_file_versions_author_staff_id_fkey" FOREIGN KEY ("author_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_file_permissions" ADD CONSTRAINT "platform_file_permissions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "platform_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_file_permissions" ADD CONSTRAINT "platform_file_permissions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_file_share_links" ADD CONSTRAINT "platform_file_share_links_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "platform_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_file_share_links" ADD CONSTRAINT "platform_file_share_links_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_file_audit_logs" ADD CONSTRAINT "platform_file_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_file_audit_logs" ADD CONSTRAINT "platform_file_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_file_retention_policies" ADD CONSTRAINT "platform_file_retention_policies_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_file_ai_jobs" ADD CONSTRAINT "platform_file_ai_jobs_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "platform_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_file_ai_jobs" ADD CONSTRAINT "platform_file_ai_jobs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
