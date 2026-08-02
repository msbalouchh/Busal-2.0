-- Busal File & Media Management Platform

CREATE TYPE "PlatformMediaType" AS ENUM (
    'IMAGE',
    'VIDEO',
    'AUDIO',
    'DOCUMENT',
    'ARCHIVE',
    'OTHER'
);
CREATE TYPE "PlatformMediaVisibility" AS ENUM ('PRIVATE', 'BUSINESS', 'PUBLIC');
CREATE TYPE "PlatformMediaStorageProvider" AS ENUM (
    'LOCAL',
    'AMAZON_S3',
    'CLOUDFLARE_R2',
    'GOOGLE_CLOUD_STORAGE',
    'AZURE_BLOB_STORAGE',
    'MINIO'
);

CREATE TABLE "platform_media_folders" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_media_folders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_media_tags" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_media_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_media_files" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "folder_id" TEXT,
    "name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_type" "PlatformMediaType" NOT NULL,
    "mime_type" TEXT NOT NULL,
    "extension" TEXT NOT NULL DEFAULT '',
    "size" INTEGER NOT NULL DEFAULT 0,
    "storage_provider" "PlatformMediaStorageProvider" NOT NULL DEFAULT 'LOCAL',
    "storage_path" TEXT NOT NULL DEFAULT '',
    "thumbnail_path" TEXT NOT NULL DEFAULT '',
    "checksum" TEXT NOT NULL DEFAULT '',
    "visibility" "PlatformMediaVisibility" NOT NULL DEFAULT 'BUSINESS',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_media_files_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_media_file_tags" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "platform_media_file_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_media_file_versions" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_media_file_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_media_folders_business_id_parent_id_idx" ON "platform_media_folders"("business_id", "parent_id");
CREATE UNIQUE INDEX "platform_media_tags_business_id_name_key" ON "platform_media_tags"("business_id", "name");
CREATE INDEX "platform_media_files_business_id_deleted_at_idx" ON "platform_media_files"("business_id", "deleted_at");
CREATE INDEX "platform_media_files_business_id_file_type_idx" ON "platform_media_files"("business_id", "file_type");
CREATE INDEX "platform_media_files_business_id_folder_id_idx" ON "platform_media_files"("business_id", "folder_id");
CREATE INDEX "platform_media_files_business_id_is_favorite_idx" ON "platform_media_files"("business_id", "is_favorite");
CREATE INDEX "platform_media_files_business_id_checksum_idx" ON "platform_media_files"("business_id", "checksum");
CREATE UNIQUE INDEX "platform_media_file_tags_file_id_tag_id_key" ON "platform_media_file_tags"("file_id", "tag_id");
CREATE UNIQUE INDEX "platform_media_file_versions_file_id_version_key" ON "platform_media_file_versions"("file_id", "version");
CREATE INDEX "platform_media_file_versions_file_id_created_at_idx" ON "platform_media_file_versions"("file_id", "created_at");

ALTER TABLE "platform_media_folders" ADD CONSTRAINT "platform_media_folders_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_media_folders" ADD CONSTRAINT "platform_media_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "platform_media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform_media_tags" ADD CONSTRAINT "platform_media_tags_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_media_files" ADD CONSTRAINT "platform_media_files_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_media_files" ADD CONSTRAINT "platform_media_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "platform_media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform_media_file_tags" ADD CONSTRAINT "platform_media_file_tags_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "platform_media_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_media_file_tags" ADD CONSTRAINT "platform_media_file_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "platform_media_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_media_file_versions" ADD CONSTRAINT "platform_media_file_versions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "platform_media_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
