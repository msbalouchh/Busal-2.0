-- Busal Document Management Platform

CREATE TYPE "PlatformDocumentType" AS ENUM (
    'INVOICE',
    'RECEIPT',
    'QUOTE',
    'PURCHASE_ORDER',
    'CONTRACT',
    'REPORT',
    'CERTIFICATE',
    'LETTER',
    'FORM',
    'CUSTOM'
);
CREATE TYPE "PlatformDocumentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'DELETED');

CREATE TABLE "platform_document_folders" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_document_folders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_document_templates" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "document_type" "PlatformDocumentType" NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "status" "PlatformTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_document_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_documents" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "folder_id" TEXT,
    "template_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "document_type" "PlatformDocumentType" NOT NULL,
    "status" "PlatformDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "file_path" TEXT NOT NULL DEFAULT '',
    "file_size" INTEGER NOT NULL DEFAULT 0,
    "mime_type" TEXT NOT NULL DEFAULT 'application/json',
    "checksum" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_document_versions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_document_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_document_folders_business_id_parent_id_idx" ON "platform_document_folders"("business_id", "parent_id");
CREATE UNIQUE INDEX "platform_document_templates_business_id_slug_key" ON "platform_document_templates"("business_id", "slug");
CREATE INDEX "platform_document_templates_business_id_document_type_idx" ON "platform_document_templates"("business_id", "document_type");
CREATE UNIQUE INDEX "platform_documents_business_id_slug_key" ON "platform_documents"("business_id", "slug");
CREATE INDEX "platform_documents_business_id_status_idx" ON "platform_documents"("business_id", "status");
CREATE INDEX "platform_documents_business_id_document_type_idx" ON "platform_documents"("business_id", "document_type");
CREATE INDEX "platform_documents_business_id_folder_id_idx" ON "platform_documents"("business_id", "folder_id");
CREATE UNIQUE INDEX "platform_document_versions_document_id_version_key" ON "platform_document_versions"("document_id", "version");
CREATE INDEX "platform_document_versions_document_id_created_at_idx" ON "platform_document_versions"("document_id", "created_at");

ALTER TABLE "platform_document_folders" ADD CONSTRAINT "platform_document_folders_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_document_folders" ADD CONSTRAINT "platform_document_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "platform_document_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform_document_templates" ADD CONSTRAINT "platform_document_templates_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_documents" ADD CONSTRAINT "platform_documents_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_documents" ADD CONSTRAINT "platform_documents_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "platform_document_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform_documents" ADD CONSTRAINT "platform_documents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "platform_document_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform_document_versions" ADD CONSTRAINT "platform_document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "platform_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
