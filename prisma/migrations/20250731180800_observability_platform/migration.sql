-- Busal Enterprise Observability Platform

CREATE TYPE "PlatformObservabilityLogLevel" AS ENUM (
    'DEBUG',
    'INFO',
    'WARNING',
    'ERROR',
    'CRITICAL'
);
CREATE TYPE "PlatformIncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "PlatformObservabilityAlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');
CREATE TYPE "PlatformIncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

CREATE TABLE "platform_metrics" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "service" TEXT NOT NULL DEFAULT '',
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "platform_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "level" "PlatformObservabilityLogLevel" NOT NULL DEFAULT 'INFO',
    "service" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL,
    "stack_trace" TEXT NOT NULL DEFAULT '',
    "checksum" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_incidents" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "severity" "PlatformIncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "PlatformIncidentStatus" NOT NULL DEFAULT 'OPEN',
    "assigned_to" TEXT NOT NULL DEFAULT '',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "platform_incidents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_alerts" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "condition" TEXT NOT NULL DEFAULT '',
    "severity" "PlatformIncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "PlatformObservabilityAlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "platform_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_metrics_business_id_service_recorded_at_idx" ON "platform_metrics"("business_id", "service", "recorded_at");
CREATE INDEX "platform_metrics_business_id_metric_recorded_at_idx" ON "platform_metrics"("business_id", "metric", "recorded_at");
CREATE INDEX "platform_logs_business_id_level_created_at_idx" ON "platform_logs"("business_id", "level", "created_at");
CREATE INDEX "platform_logs_business_id_service_created_at_idx" ON "platform_logs"("business_id", "service", "created_at");
CREATE INDEX "platform_logs_business_id_category_created_at_idx" ON "platform_logs"("business_id", "category", "created_at");
CREATE INDEX "platform_incidents_business_id_status_severity_idx" ON "platform_incidents"("business_id", "status", "severity");
CREATE INDEX "platform_incidents_business_id_started_at_idx" ON "platform_incidents"("business_id", "started_at");
CREATE INDEX "platform_alerts_business_id_status_severity_idx" ON "platform_alerts"("business_id", "status", "severity");
CREATE INDEX "platform_alerts_business_id_triggered_at_idx" ON "platform_alerts"("business_id", "triggered_at");

ALTER TABLE "platform_metrics" ADD CONSTRAINT "platform_metrics_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_logs" ADD CONSTRAINT "platform_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_incidents" ADD CONSTRAINT "platform_incidents_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_alerts" ADD CONSTRAINT "platform_alerts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
