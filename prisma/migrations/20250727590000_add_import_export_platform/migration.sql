-- Import & Export Platform permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'import_export_platform.view', 'View Import & Export Platform', 'View import/export jobs, templates, and history', 'import_export_platform', NOW(), NOW()),
  (gen_random_uuid(), 'import_export_platform.manage', 'Manage Import & Export Platform', 'Run imports, exports, and manage templates', 'import_export_platform', NOW(), NOW()),
  (gen_random_uuid(), 'import_export_platform.admin', 'Administer Import & Export Platform', 'Full import/export platform administration', 'import_export_platform', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "ImportExportFormat" AS ENUM ('CSV', 'EXCEL', 'JSON', 'PDF');

-- CreateEnum
CREATE TYPE "ImportExportJobType" AS ENUM ('IMPORT', 'EXPORT');

-- CreateEnum
CREATE TYPE "ImportExportJobStatus" AS ENUM ('PENDING', 'PREVIEW', 'VALIDATING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ROLLED_BACK', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImportExportScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ImportExportAuditEventType" AS ENUM ('SCHEMA_REGISTERED', 'TEMPLATE_CREATED', 'TEMPLATE_UPDATED', 'IMPORT_STARTED', 'IMPORT_PREVIEW', 'IMPORT_VALIDATED', 'IMPORT_COMPLETED', 'IMPORT_FAILED', 'IMPORT_ROLLED_BACK', 'EXPORT_STARTED', 'EXPORT_COMPLETED', 'EXPORT_FAILED', 'SCHEDULE_CREATED', 'SCHEDULE_TRIGGERED', 'DUPLICATE_DETECTED', 'BATCH_PROCESSED', 'DASHBOARD_ACCESS', 'API_IMPORT', 'API_EXPORT', 'NOTIFICATION_SENT');

-- CreateTable
CREATE TABLE "import_export_schemas" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "schema_key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "import_formats" JSONB NOT NULL,
    "export_formats" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_export_schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_export_templates" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "schema_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "ImportExportFormat" NOT NULL,
    "field_mappings" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_export_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_export_schedules" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "schema_id" TEXT,
    "name" TEXT NOT NULL,
    "job_type" "ImportExportJobType" NOT NULL,
    "format" "ImportExportFormat" NOT NULL,
    "module" TEXT NOT NULL,
    "frequency" "ImportExportScheduleFrequency" NOT NULL,
    "cron_expression" TEXT NOT NULL,
    "field_mappings" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_export_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_export_jobs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "schema_id" TEXT,
    "user_id" TEXT,
    "schedule_id" TEXT,
    "job_type" "ImportExportJobType" NOT NULL,
    "format" "ImportExportFormat" NOT NULL,
    "status" "ImportExportJobStatus" NOT NULL DEFAULT 'PENDING',
    "module" TEXT NOT NULL,
    "file_name" TEXT,
    "source" TEXT NOT NULL DEFAULT 'DASHBOARD',
    "progress_pct" INTEGER NOT NULL DEFAULT 0,
    "total_records" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "duplicate_count" INTEGER NOT NULL DEFAULT 0,
    "preview_data" JSONB,
    "validation_errors" JSONB,
    "field_mappings" JSONB,
    "output_payload" JSONB,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_export_job_records" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "job_id" TEXT NOT NULL,
    "row_index" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "input_data" JSONB NOT NULL,
    "output_data" JSONB,
    "error_message" TEXT,
    "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_export_job_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_export_platform_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "user_id" TEXT,
    "event_type" "ImportExportAuditEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_export_platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "import_export_schemas_business_id_schema_key_key" ON "import_export_schemas"("business_id", "schema_key");

-- CreateIndex
CREATE INDEX "import_export_schemas_module_idx" ON "import_export_schemas"("module");

-- CreateIndex
CREATE INDEX "import_export_templates_business_id_schema_id_idx" ON "import_export_templates"("business_id", "schema_id");

-- CreateIndex
CREATE INDEX "import_export_schedules_business_id_is_active_next_run_at_idx" ON "import_export_schedules"("business_id", "is_active", "next_run_at");

-- CreateIndex
CREATE INDEX "import_export_jobs_business_id_job_type_status_created_at_idx" ON "import_export_jobs"("business_id", "job_type", "status", "created_at");

-- CreateIndex
CREATE INDEX "import_export_job_records_job_id_row_index_idx" ON "import_export_job_records"("job_id", "row_index");

-- CreateIndex
CREATE INDEX "import_export_platform_audit_logs_business_id_event_type_created_at_idx" ON "import_export_platform_audit_logs"("business_id", "event_type", "created_at");

-- AddForeignKey
ALTER TABLE "import_export_schemas" ADD CONSTRAINT "import_export_schemas_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_templates" ADD CONSTRAINT "import_export_templates_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_templates" ADD CONSTRAINT "import_export_templates_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "import_export_schemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_schedules" ADD CONSTRAINT "import_export_schedules_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_schedules" ADD CONSTRAINT "import_export_schedules_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "import_export_schemas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_jobs" ADD CONSTRAINT "import_export_jobs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_jobs" ADD CONSTRAINT "import_export_jobs_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "import_export_schemas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_jobs" ADD CONSTRAINT "import_export_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_jobs" ADD CONSTRAINT "import_export_jobs_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "import_export_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_job_records" ADD CONSTRAINT "import_export_job_records_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_job_records" ADD CONSTRAINT "import_export_job_records_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "import_export_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_platform_audit_logs" ADD CONSTRAINT "import_export_platform_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_platform_audit_logs" ADD CONSTRAINT "import_export_platform_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
