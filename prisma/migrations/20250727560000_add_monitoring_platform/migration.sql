-- Monitoring Platform permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'monitoring_platform.view', 'View Monitoring Platform', 'View health, metrics, logs, and alerts', 'monitoring_platform', NOW(), NOW()),
  (gen_random_uuid(), 'monitoring_platform.manage', 'Manage Monitoring Platform', 'Manage alerts, retention, and health checks', 'monitoring_platform', NOW(), NOW()),
  (gen_random_uuid(), 'monitoring_platform.admin', 'Administer Monitoring Platform', 'Full monitoring platform administration', 'monitoring_platform', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "MonitoringHealthTargetType" AS ENUM ('PLATFORM', 'SERVICE', 'DATABASE', 'CACHE', 'QUEUE', 'STORAGE', 'API', 'AI', 'WORKER');

-- CreateEnum
CREATE TYPE "MonitoringHealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MonitoringLogLevel" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MonitoringPerformanceCategory" AS ENUM ('API', 'DATABASE', 'CACHE', 'QUEUE', 'WORKFLOW', 'AI', 'FILE_UPLOAD');

-- CreateEnum
CREATE TYPE "MonitoringErrorType" AS ENUM ('EXCEPTION', 'API_ERROR', 'DATABASE_ERROR', 'QUEUE_FAILURE', 'JOB_FAILURE', 'INTEGRATION_FAILURE', 'AI_FAILURE', 'NOTIFICATION_FAILURE');

-- CreateEnum
CREATE TYPE "MonitoringAlertType" AS ENUM ('HIGH_CPU', 'HIGH_MEMORY', 'DATABASE_FAILURE', 'API_FAILURE', 'QUEUE_FAILURE', 'FAILED_JOB', 'STORAGE_ISSUE', 'AI_FAILURE', 'NOTIFICATION_FAILURE');

-- CreateEnum
CREATE TYPE "MonitoringAlertChannel" AS ENUM ('EMAIL', 'IN_APP', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "MonitoringAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "MonitoringAuditEventType" AS ENUM ('ALERT_TRIGGERED', 'ALERT_ACKNOWLEDGED', 'ALERT_RESOLVED', 'CONFIG_CHANGED', 'DASHBOARD_ACCESS', 'HEALTH_CHECK', 'RETENTION_APPLIED', 'CHECK_REGISTERED');

-- CreateTable
CREATE TABLE "monitoring_health_checks" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "check_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_type" "MonitoringHealthTargetType" NOT NULL,
    "service_target" TEXT NOT NULL,
    "status" "MonitoringHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "last_checked_at" TIMESTAMP(3),
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitoring_health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_metric_snapshots" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "snapshot_key" TEXT NOT NULL,
    "cpu_usage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memory_usage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disk_usage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "network_usage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "database_connections" INTEGER NOT NULL DEFAULT 0,
    "active_sessions" INTEGER NOT NULL DEFAULT 0,
    "queue_length" INTEGER NOT NULL DEFAULT 0,
    "background_jobs" INTEGER NOT NULL DEFAULT 0,
    "cache_hit_rate" DOUBLE PRECISION,
    "storage_usage_bytes" BIGINT,
    "metadata" JSONB,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_performance_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "category" "MonitoringPerformanceCategory" NOT NULL,
    "operation_key" TEXT NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "is_slow" BOOLEAN NOT NULL DEFAULT false,
    "correlation_id" TEXT,
    "request_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_performance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_error_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "user_id" TEXT,
    "branch_id" TEXT,
    "error_type" "MonitoringErrorType" NOT NULL,
    "message" TEXT NOT NULL,
    "stack_trace" TEXT,
    "correlation_id" TEXT,
    "request_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_structured_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "user_id" TEXT,
    "level" "MonitoringLogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "correlation_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_structured_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_alerts" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "alert_type" "MonitoringAlertType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "MonitoringAlertStatus" NOT NULL DEFAULT 'OPEN',
    "channels" JSONB NOT NULL DEFAULT '["IN_APP"]',
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitoring_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_retention_policies" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "name" TEXT NOT NULL,
    "log_retention_days" INTEGER NOT NULL DEFAULT 30,
    "metrics_retention_days" INTEGER NOT NULL DEFAULT 90,
    "alert_history_days" INTEGER NOT NULL DEFAULT 180,
    "archive_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitoring_retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_platform_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "user_id" TEXT,
    "event_type" "MonitoringAuditEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_health_checks_business_id_check_key_key" ON "monitoring_health_checks"("business_id", "check_key");

-- CreateIndex
CREATE INDEX "monitoring_health_checks_business_id_target_type_idx" ON "monitoring_health_checks"("business_id", "target_type");

-- CreateIndex
CREATE INDEX "monitoring_metric_snapshots_business_id_captured_at_idx" ON "monitoring_metric_snapshots"("business_id", "captured_at");

-- CreateIndex
CREATE INDEX "monitoring_performance_logs_business_id_category_created_at_idx" ON "monitoring_performance_logs"("business_id", "category", "created_at");

-- CreateIndex
CREATE INDEX "monitoring_error_logs_business_id_error_type_created_at_idx" ON "monitoring_error_logs"("business_id", "error_type", "created_at");

-- CreateIndex
CREATE INDEX "monitoring_structured_logs_business_id_level_created_at_idx" ON "monitoring_structured_logs"("business_id", "level", "created_at");

-- CreateIndex
CREATE INDEX "monitoring_structured_logs_business_id_correlation_id_idx" ON "monitoring_structured_logs"("business_id", "correlation_id");

-- CreateIndex
CREATE INDEX "monitoring_alerts_business_id_status_triggered_at_idx" ON "monitoring_alerts"("business_id", "status", "triggered_at");

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_retention_policies_business_id_name_key" ON "monitoring_retention_policies"("business_id", "name");

-- CreateIndex
CREATE INDEX "monitoring_platform_audit_logs_business_id_event_type_created_at_idx" ON "monitoring_platform_audit_logs"("business_id", "event_type", "created_at");

-- AddForeignKey
ALTER TABLE "monitoring_health_checks" ADD CONSTRAINT "monitoring_health_checks_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_metric_snapshots" ADD CONSTRAINT "monitoring_metric_snapshots_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_performance_logs" ADD CONSTRAINT "monitoring_performance_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_error_logs" ADD CONSTRAINT "monitoring_error_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_error_logs" ADD CONSTRAINT "monitoring_error_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_structured_logs" ADD CONSTRAINT "monitoring_structured_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_structured_logs" ADD CONSTRAINT "monitoring_structured_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_retention_policies" ADD CONSTRAINT "monitoring_retention_policies_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_platform_audit_logs" ADD CONSTRAINT "monitoring_platform_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_platform_audit_logs" ADD CONSTRAINT "monitoring_platform_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
