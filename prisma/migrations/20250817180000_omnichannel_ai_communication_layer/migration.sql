-- CreateEnum
CREATE TYPE "CustomerAiChannelProvider" AS ENUM ('META', 'TWILIO', 'TIKTOK', 'MANUAL');

-- CreateEnum
CREATE TYPE "CustomerAiChannelConnectionStatus" AS ENUM ('PENDING', 'CONNECTED', 'DISCONNECTED', 'ERROR', 'REQUIRES_REAUTH');

-- CreateTable
CREATE TABLE "customer_ai_channel_connections" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "provider" "CustomerAiChannelProvider" NOT NULL,
    "external_account_id" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "status" "CustomerAiChannelConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "encrypted_credentials" TEXT NOT NULL DEFAULT '',
    "token_expires_at" TIMESTAMP(3),
    "webhook_verified" BOOLEAN NOT NULL DEFAULT false,
    "webhook_verify_token" TEXT,
    "ai_enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "last_health_check_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_ai_channel_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_ai_external_threads" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "external_conversation_id" TEXT NOT NULL,
    "external_customer_id" TEXT NOT NULL,
    "customer_display_name" TEXT,
    "ai_conversation_id" TEXT,
    "communication_conversation_id" TEXT,
    "session_token" TEXT,
    "handoff_to_human" BOOLEAN NOT NULL DEFAULT false,
    "handoff_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_ai_external_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_ai_channel_message_dedup" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "external_message_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "customer_ai_channel_message_dedup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_ai_channel_connections_business_id_channel_idx" ON "customer_ai_channel_connections"("business_id", "channel");

-- CreateIndex
CREATE INDEX "customer_ai_channel_connections_business_id_status_idx" ON "customer_ai_channel_connections"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "customer_ai_channel_connections_channel_external_account_id_key" ON "customer_ai_channel_connections"("channel", "external_account_id");

-- CreateIndex
CREATE INDEX "customer_ai_external_threads_business_id_channel_last_message_at_idx" ON "customer_ai_external_threads"("business_id", "channel", "last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "customer_ai_external_threads_connection_id_external_conversation_id_key" ON "customer_ai_external_threads"("connection_id", "external_conversation_id");

-- CreateIndex
CREATE INDEX "customer_ai_channel_message_dedup_business_id_channel_processed_at_idx" ON "customer_ai_channel_message_dedup"("business_id", "channel", "processed_at");

-- CreateIndex
CREATE UNIQUE INDEX "customer_ai_channel_message_dedup_connection_id_external_message_id_key" ON "customer_ai_channel_message_dedup"("connection_id", "external_message_id");

-- AddForeignKey
ALTER TABLE "customer_ai_channel_connections" ADD CONSTRAINT "customer_ai_channel_connections_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_ai_external_threads" ADD CONSTRAINT "customer_ai_external_threads_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_ai_external_threads" ADD CONSTRAINT "customer_ai_external_threads_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "customer_ai_channel_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_ai_channel_message_dedup" ADD CONSTRAINT "customer_ai_channel_message_dedup_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "customer_ai_channel_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
