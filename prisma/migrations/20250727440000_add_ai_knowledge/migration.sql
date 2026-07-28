-- Knowledge permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'ai.knowledge.view', 'View Knowledge', 'View knowledge collections and documents', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.knowledge.upload', 'Upload Knowledge', 'Upload knowledge documents and sources', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.knowledge.edit', 'Edit Knowledge', 'Edit knowledge documents and metadata', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.knowledge.delete', 'Delete Knowledge', 'Delete or archive knowledge documents', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.knowledge.admin', 'Administer Knowledge', 'Full knowledge engine administration', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('BUSINESS_DOCUMENT', 'SOP', 'TRAINING_MANUAL', 'POLICY', 'CONTRACT', 'PRODUCT_DOCUMENTATION', 'FAQ', 'HELP_ARTICLE', 'INTERNAL_NOTE', 'UPLOADED_FILE');

-- CreateEnum
CREATE TYPE "KnowledgeDocumentFormat" AS ENUM ('PDF', 'DOCX', 'TXT', 'MARKDOWN', 'CSV', 'HTML');

-- CreateEnum
CREATE TYPE "KnowledgeDocumentStatus" AS ENUM ('DRAFT', 'PROCESSING', 'PUBLISHED', 'ARCHIVED', 'FAILED');

-- CreateEnum
CREATE TYPE "KnowledgeConnectorType" AS ENUM ('GOOGLE_DRIVE', 'ONEDRIVE', 'SHAREPOINT', 'CONFLUENCE', 'NOTION', 'DROPBOX', 'GITHUB', 'MANUAL');

-- CreateEnum
CREATE TYPE "KnowledgeConnectorStatus" AS ENUM ('PLANNED', 'DISABLED', 'ACTIVE');

-- CreateTable
CREATE TABLE "knowledge_collections" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "department" TEXT,
    "industry" TEXT,
    "module" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_sources" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "source_type" "KnowledgeSourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "connector_type" "KnowledgeConnectorType" NOT NULL DEFAULT 'MANUAL',
    "external_id" TEXT,
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "current_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_document_versions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "format" "KnowledgeDocumentFormat" NOT NULL,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "author_user_id" TEXT,
    "author_staff_id" TEXT,
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "file_name" TEXT,
    "raw_content" TEXT,
    "content_hash" TEXT,
    "revision_note" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "document_version_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "token_count" INTEGER NOT NULL,
    "metadata" JSONB,
    "embedding" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_connectors" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "connector_type" "KnowledgeConnectorType" NOT NULL,
    "status" "KnowledgeConnectorStatus" NOT NULL DEFAULT 'PLANNED',
    "integration_ready" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_search_audits" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "user_id" TEXT,
    "staff_id" TEXT,
    "agent_id" TEXT,
    "query" TEXT NOT NULL,
    "collection_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "retrieved_chunk_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "retrieved_document_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "confidence_score" DOUBLE PRECISION,
    "response_quality" DOUBLE PRECISION,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_search_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_collections_business_id_branch_id_idx" ON "knowledge_collections"("business_id", "branch_id");

-- CreateIndex
CREATE INDEX "knowledge_collections_business_id_module_language_idx" ON "knowledge_collections"("business_id", "module", "language");

-- CreateIndex
CREATE INDEX "knowledge_sources_business_id_source_type_idx" ON "knowledge_sources"("business_id", "source_type");

-- CreateIndex
CREATE INDEX "knowledge_documents_business_id_collection_id_idx" ON "knowledge_documents"("business_id", "collection_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_documents_current_version_id_key" ON "knowledge_documents"("current_version_id");

-- CreateIndex
CREATE INDEX "knowledge_document_versions_business_id_status_idx" ON "knowledge_document_versions"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_document_versions_document_id_version_number_key" ON "knowledge_document_versions"("document_id", "version_number");

-- CreateIndex
CREATE INDEX "knowledge_chunks_business_id_branch_id_idx" ON "knowledge_chunks"("business_id", "branch_id");

-- CreateIndex
CREATE INDEX "knowledge_chunks_document_version_id_chunk_index_idx" ON "knowledge_chunks"("document_version_id", "chunk_index");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_connectors_business_id_connector_type_key" ON "knowledge_connectors"("business_id", "connector_type");

-- CreateIndex
CREATE INDEX "knowledge_search_audits_business_id_created_at_idx" ON "knowledge_search_audits"("business_id", "created_at");

-- AddForeignKey
ALTER TABLE "knowledge_collections" ADD CONSTRAINT "knowledge_collections_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_collections" ADD CONSTRAINT "knowledge_collections_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "knowledge_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "knowledge_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_document_versions" ADD CONSTRAINT "knowledge_document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_version_id_fkey" FOREIGN KEY ("document_version_id") REFERENCES "knowledge_document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_connectors" ADD CONSTRAINT "knowledge_connectors_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_search_audits" ADD CONSTRAINT "knowledge_search_audits_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
