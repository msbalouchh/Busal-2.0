-- Busal Integration Platform

CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'DISCONNECTED');
CREATE TYPE "IntegrationCategory" AS ENUM (
    'PAYMENT',
    'MESSAGING',
    'EMAIL',
    'ACCOUNTING',
    'ECOMMERCE',
    'MARKETING',
    'AUTOMATION',
    'COMMUNICATION',
    'CRM',
    'PRODUCTIVITY',
    'OTHER'
);
CREATE TYPE "IntegrationSyncStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "IntegrationLogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

CREATE TABLE "integration_providers" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "IntegrationCategory" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'INACTIVE',
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_providers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "integration_connections" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'INACTIVE',
    "credentials" TEXT NOT NULL DEFAULT '',
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "integration_webhooks" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'INACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_webhooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "integration_sync_jobs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "status" "IntegrationSyncStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_sync_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "integration_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "connection_id" TEXT,
    "level" "IntegrationLogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "integration_providers_business_id_slug_key" ON "integration_providers"("business_id", "slug");
CREATE INDEX "integration_providers_business_id_status_idx" ON "integration_providers"("business_id", "status");
CREATE INDEX "integration_providers_business_id_category_idx" ON "integration_providers"("business_id", "category");
CREATE INDEX "integration_connections_business_id_status_idx" ON "integration_connections"("business_id", "status");
CREATE INDEX "integration_connections_business_id_provider_id_idx" ON "integration_connections"("business_id", "provider_id");
CREATE INDEX "integration_webhooks_business_id_provider_id_idx" ON "integration_webhooks"("business_id", "provider_id");
CREATE INDEX "integration_webhooks_business_id_status_idx" ON "integration_webhooks"("business_id", "status");
CREATE INDEX "integration_sync_jobs_business_id_status_idx" ON "integration_sync_jobs"("business_id", "status");
CREATE INDEX "integration_sync_jobs_connection_id_created_at_idx" ON "integration_sync_jobs"("connection_id", "created_at");
CREATE INDEX "integration_logs_business_id_created_at_idx" ON "integration_logs"("business_id", "created_at");
CREATE INDEX "integration_logs_connection_id_created_at_idx" ON "integration_logs"("connection_id", "created_at");

ALTER TABLE "integration_providers" ADD CONSTRAINT "integration_providers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "integration_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_webhooks" ADD CONSTRAINT "integration_webhooks_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_webhooks" ADD CONSTRAINT "integration_webhooks_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "integration_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_sync_jobs" ADD CONSTRAINT "integration_sync_jobs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_sync_jobs" ADD CONSTRAINT "integration_sync_jobs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
