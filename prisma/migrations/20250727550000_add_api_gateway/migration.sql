-- API Gateway permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'api_gateway.view', 'View API Gateway', 'View API routes, monitoring, and registry', 'api_gateway', NOW(), NOW()),
  (gen_random_uuid(), 'api_gateway.invoke', 'Invoke API Gateway', 'Route requests through the API gateway', 'api_gateway', NOW(), NOW()),
  (gen_random_uuid(), 'api_gateway.manage', 'Manage API Gateway', 'Manage routes, webhooks, and rate limits', 'api_gateway', NOW(), NOW()),
  (gen_random_uuid(), 'api_gateway.admin', 'Administer API Gateway', 'Full API gateway administration', 'api_gateway', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "ApiRouteType" AS ENUM ('INTERNAL', 'PUBLIC', 'PARTNER', 'MARKETPLACE', 'AI', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "ApiAuthMethod" AS ENUM ('JWT', 'OAUTH2', 'API_KEY', 'SERVICE_ACCOUNT');

-- CreateEnum
CREATE TYPE "ApiVersionStrategy" AS ENUM ('URI', 'HEADER');

-- CreateEnum
CREATE TYPE "ApiRateLimitScope" AS ENUM ('API_KEY', 'USER', 'BUSINESS', 'IP', 'SERVICE_ACCOUNT');

-- CreateEnum
CREATE TYPE "ApiWebhookDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "ApiGatewayAuditEventType" AS ENUM ('API_CALL', 'AUTH_SUCCESS', 'AUTH_FAILURE', 'PERMISSION_DENIED', 'WEBHOOK_DELIVERY', 'RATE_LIMIT_VIOLATION', 'VERSION_USAGE', 'ROUTE_REGISTERED', 'WEBHOOK_REGISTERED');

-- CreateTable
CREATE TABLE "api_routes" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "route_key" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "route_type" "ApiRouteType" NOT NULL,
    "service_target" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "version_strategy" "ApiVersionStrategy" NOT NULL DEFAULT 'URI',
    "required_permission" TEXT,
    "api_scopes" JSONB NOT NULL DEFAULT '[]',
    "auth_methods" JSONB NOT NULL DEFAULT '["JWT","API_KEY"]',
    "max_payload_bytes" INTEGER NOT NULL DEFAULT 1048576,
    "allowed_content_types" JSONB NOT NULL DEFAULT '["application/json"]',
    "request_schema" JSONB,
    "openapi_spec" JSONB,
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_rate_limit_policies" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "name" TEXT NOT NULL,
    "scope" "ApiRateLimitScope" NOT NULL,
    "scope_identifier" TEXT NOT NULL,
    "requests_per_minute" INTEGER NOT NULL DEFAULT 60,
    "burst_limit" INTEGER NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_rate_limit_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_request_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "route_id" TEXT,
    "user_id" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "api_version" TEXT,
    "status_code" INTEGER NOT NULL,
    "response_time_ms" INTEGER NOT NULL,
    "client_type" TEXT,
    "client_id" TEXT,
    "ip_address" TEXT,
    "auth_method" "ApiAuthMethod",
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_webhook_registrations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" JSONB NOT NULL DEFAULT '[]',
    "retry_policy" JSONB NOT NULL DEFAULT '{"maxAttempts":5,"backoffMs":1000}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_webhook_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "ApiWebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "response_status" INTEGER,
    "error_message" TEXT,
    "delivered_at" TIMESTAMP(3),
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_gateway_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "user_id" TEXT,
    "route_id" TEXT,
    "route_key" TEXT,
    "event_type" "ApiGatewayAuditEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_gateway_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_routes_business_id_route_key_version_key" ON "api_routes"("business_id", "route_key", "version");

-- CreateIndex
CREATE INDEX "api_routes_business_id_route_type_idx" ON "api_routes"("business_id", "route_type");

-- CreateIndex
CREATE INDEX "api_routes_path_method_idx" ON "api_routes"("path", "method");

-- CreateIndex
CREATE UNIQUE INDEX "api_rate_limit_policies_business_id_scope_scope_identifier_key" ON "api_rate_limit_policies"("business_id", "scope", "scope_identifier");

-- CreateIndex
CREATE INDEX "api_rate_limit_policies_business_id_scope_idx" ON "api_rate_limit_policies"("business_id", "scope");

-- CreateIndex
CREATE INDEX "api_request_logs_business_id_created_at_idx" ON "api_request_logs"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "api_request_logs_route_id_created_at_idx" ON "api_request_logs"("route_id", "created_at");

-- CreateIndex
CREATE INDEX "api_request_logs_client_id_created_at_idx" ON "api_request_logs"("client_id", "created_at");

-- CreateIndex
CREATE INDEX "api_webhook_registrations_business_id_is_active_idx" ON "api_webhook_registrations"("business_id", "is_active");

-- CreateIndex
CREATE INDEX "api_webhook_deliveries_business_id_status_idx" ON "api_webhook_deliveries"("business_id", "status");

-- CreateIndex
CREATE INDEX "api_webhook_deliveries_registration_id_created_at_idx" ON "api_webhook_deliveries"("registration_id", "created_at");

-- CreateIndex
CREATE INDEX "api_gateway_audit_logs_business_id_event_type_created_at_idx" ON "api_gateway_audit_logs"("business_id", "event_type", "created_at");

-- AddForeignKey
ALTER TABLE "api_routes" ADD CONSTRAINT "api_routes_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_rate_limit_policies" ADD CONSTRAINT "api_rate_limit_policies_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_request_logs" ADD CONSTRAINT "api_request_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_request_logs" ADD CONSTRAINT "api_request_logs_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "api_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_request_logs" ADD CONSTRAINT "api_request_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_webhook_registrations" ADD CONSTRAINT "api_webhook_registrations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_webhook_deliveries" ADD CONSTRAINT "api_webhook_deliveries_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "api_webhook_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_webhook_deliveries" ADD CONSTRAINT "api_webhook_deliveries_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_gateway_audit_logs" ADD CONSTRAINT "api_gateway_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_gateway_audit_logs" ADD CONSTRAINT "api_gateway_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_gateway_audit_logs" ADD CONSTRAINT "api_gateway_audit_logs_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "api_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
