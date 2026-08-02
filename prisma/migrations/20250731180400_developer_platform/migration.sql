-- Busal Developer Platform & Public API

CREATE TYPE "PlatformApiStatus" AS ENUM ('ACTIVE', 'DISABLED', 'REVOKED', 'EXPIRED');
CREATE TYPE "PlatformApiVersion" AS ENUM ('V1', 'V2');

CREATE TABLE "platform_api_applications" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT NOT NULL,
    "status" "PlatformApiStatus" NOT NULL DEFAULT 'ACTIVE',
    "api_version" "PlatformApiVersion" NOT NULL DEFAULT 'V1',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_api_applications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_api_keys" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashed_key" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "status" "PlatformApiStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_api_keys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_api_webhook_subscriptions" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "status" "PlatformApiStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_api_webhook_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_api_request_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "application_id" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "ip_address" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_api_request_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_api_applications_client_id_key" ON "platform_api_applications"("client_id");
CREATE INDEX "platform_api_applications_business_id_status_idx" ON "platform_api_applications"("business_id", "status");
CREATE INDEX "platform_api_keys_business_id_status_idx" ON "platform_api_keys"("business_id", "status");
CREATE INDEX "platform_api_keys_application_id_status_idx" ON "platform_api_keys"("application_id", "status");
CREATE INDEX "platform_api_webhook_subscriptions_business_id_event_idx" ON "platform_api_webhook_subscriptions"("business_id", "event");
CREATE INDEX "platform_api_webhook_subscriptions_application_id_status_idx" ON "platform_api_webhook_subscriptions"("application_id", "status");
CREATE INDEX "platform_api_request_logs_business_id_created_at_idx" ON "platform_api_request_logs"("business_id", "created_at");
CREATE INDEX "platform_api_request_logs_application_id_created_at_idx" ON "platform_api_request_logs"("application_id", "created_at");

ALTER TABLE "platform_api_applications" ADD CONSTRAINT "platform_api_applications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_api_keys" ADD CONSTRAINT "platform_api_keys_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "platform_api_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_api_keys" ADD CONSTRAINT "platform_api_keys_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_api_webhook_subscriptions" ADD CONSTRAINT "platform_api_webhook_subscriptions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_api_webhook_subscriptions" ADD CONSTRAINT "platform_api_webhook_subscriptions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "platform_api_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_api_request_logs" ADD CONSTRAINT "platform_api_request_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_api_request_logs" ADD CONSTRAINT "platform_api_request_logs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "platform_api_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
