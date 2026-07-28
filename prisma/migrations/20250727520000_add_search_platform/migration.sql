-- Search platform permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'search.view', 'View Search', 'Access search platform dashboard and index status', 'search', NOW(), NOW()),
  (gen_random_uuid(), 'search.query', 'Execute Search', 'Run global search queries', 'search', NOW(), NOW()),
  (gen_random_uuid(), 'search.manage_index', 'Manage Search Index', 'Manage indexing jobs and reindex operations', 'search', NOW(), NOW()),
  (gen_random_uuid(), 'search.admin', 'Administer Search', 'Full search platform administration', 'search', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "SearchEntityType" AS ENUM ('CUSTOMER', 'STAFF', 'BUSINESS', 'BRANCH', 'ORDER', 'RESERVATION', 'TABLE', 'MENU_ITEM', 'INVENTORY', 'SUPPLIER', 'CRM', 'LEAD', 'OPPORTUNITY', 'QUOTE', 'CONTRACT', 'PROJECT', 'FILE', 'CONVERSATION', 'AI_KNOWLEDGE', 'MARKETPLACE_ASSET', 'REPORT', 'WORKFLOW');

-- CreateEnum
CREATE TYPE "SearchIndexStatus" AS ENUM ('QUEUED', 'INDEXED', 'FAILED', 'STALE');

-- CreateEnum
CREATE TYPE "SearchIndexJobType" AS ENUM ('INCREMENTAL', 'FULL_REBUILD', 'REINDEX_ENTITY');

-- CreateEnum
CREATE TYPE "SearchIndexJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SearchAuditEventType" AS ENUM ('QUERY', 'RESULT_CLICK', 'REINDEX', 'INDEX_FAILED', 'FULL_REBUILD', 'INCREMENTAL_INDEX');

-- CreateEnum
CREATE TYPE "SearchSuggestionType" AS ENUM ('RECENT', 'TRENDING', 'AUTOCOMPLETE');

-- CreateEnum
CREATE TYPE "SearchMatchMode" AS ENUM ('FULL_TEXT', 'PREFIX', 'FUZZY', 'EXACT');

-- CreateTable
CREATE TABLE "search_index_records" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "entity_type" "SearchEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "searchable_text" TEXT NOT NULL,
    "searchable_fields" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB,
    "required_permission" TEXT,
    "status" "SearchIndexStatus" NOT NULL DEFAULT 'QUEUED',
    "last_indexed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_index_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_index_jobs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "job_type" "SearchIndexJobType" NOT NULL,
    "status" "SearchIndexJobStatus" NOT NULL DEFAULT 'QUEUED',
    "entity_type" "SearchEntityType",
    "entity_id" TEXT,
    "error_message" TEXT,
    "metadata" JSONB,
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "search_index_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_query_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT,
    "query" TEXT NOT NULL,
    "match_mode" "SearchMatchMode" NOT NULL DEFAULT 'FULL_TEXT',
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "filters" JSONB,
    "facets" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_result_clicks" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT,
    "query_log_id" TEXT,
    "index_record_id" TEXT NOT NULL,
    "entity_type" "SearchEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_result_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_suggestions" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT,
    "suggestion_type" "SearchSuggestionType" NOT NULL,
    "query" TEXT NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 1,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" "SearchAuditEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_ai_configs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "semantic_enabled" BOOLEAN NOT NULL DEFAULT false,
    "vector_enabled" BOOLEAN NOT NULL DEFAULT false,
    "nl_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ai_ranking_enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_ai_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "search_index_records_business_id_entity_type_entity_id_key" ON "search_index_records"("business_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "search_index_records_business_id_status_idx" ON "search_index_records"("business_id", "status");

-- CreateIndex
CREATE INDEX "search_index_records_business_id_entity_type_idx" ON "search_index_records"("business_id", "entity_type");

-- CreateIndex
CREATE INDEX "search_index_records_business_id_branch_id_idx" ON "search_index_records"("business_id", "branch_id");

-- CreateIndex
CREATE INDEX "search_index_jobs_business_id_status_idx" ON "search_index_jobs"("business_id", "status");

-- CreateIndex
CREATE INDEX "search_index_jobs_business_id_job_type_idx" ON "search_index_jobs"("business_id", "job_type");

-- CreateIndex
CREATE INDEX "search_query_logs_business_id_created_at_idx" ON "search_query_logs"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "search_query_logs_user_id_created_at_idx" ON "search_query_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "search_result_clicks_business_id_created_at_idx" ON "search_result_clicks"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "search_result_clicks_query_log_id_idx" ON "search_result_clicks"("query_log_id");

-- CreateIndex
CREATE UNIQUE INDEX "search_suggestions_business_id_user_id_suggestion_type_query_key" ON "search_suggestions"("business_id", "user_id", "suggestion_type", "query");

-- CreateIndex
CREATE INDEX "search_suggestions_business_id_suggestion_type_hit_count_idx" ON "search_suggestions"("business_id", "suggestion_type", "hit_count");

-- CreateIndex
CREATE INDEX "search_audit_logs_business_id_event_type_created_at_idx" ON "search_audit_logs"("business_id", "event_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "search_ai_configs_business_id_key" ON "search_ai_configs"("business_id");

-- AddForeignKey
ALTER TABLE "search_index_records" ADD CONSTRAINT "search_index_records_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_index_jobs" ADD CONSTRAINT "search_index_jobs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_query_logs" ADD CONSTRAINT "search_query_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_query_logs" ADD CONSTRAINT "search_query_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_result_clicks" ADD CONSTRAINT "search_result_clicks_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_result_clicks" ADD CONSTRAINT "search_result_clicks_query_log_id_fkey" FOREIGN KEY ("query_log_id") REFERENCES "search_query_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_result_clicks" ADD CONSTRAINT "search_result_clicks_index_record_id_fkey" FOREIGN KEY ("index_record_id") REFERENCES "search_index_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_suggestions" ADD CONSTRAINT "search_suggestions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_suggestions" ADD CONSTRAINT "search_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_audit_logs" ADD CONSTRAINT "search_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_audit_logs" ADD CONSTRAINT "search_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_ai_configs" ADD CONSTRAINT "search_ai_configs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
