-- Busal Communication Platform

CREATE TYPE "PlatformChannelType" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'IN_APP', 'VOICE', 'WEBHOOK');
CREATE TYPE "PlatformMessageStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED');
CREATE TYPE "PlatformMessageDirection" AS ENUM ('OUTBOUND', 'INBOUND');
CREATE TYPE "PlatformChannelStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');
CREATE TYPE "PlatformTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "PlatformCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED');

CREATE TABLE "platform_communication_channels" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PlatformChannelType" NOT NULL,
    "status" "PlatformChannelStatus" NOT NULL DEFAULT 'INACTIVE',
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_communication_channels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_communication_templates" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "channel" "PlatformChannelType" NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "status" "PlatformTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_communication_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_communication_messages" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "channel" "PlatformChannelType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "status" "PlatformMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "direction" "PlatformMessageDirection" NOT NULL DEFAULT 'OUTBOUND',
    "provider_reference" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_communication_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_communication_campaigns" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "PlatformChannelType" NOT NULL,
    "status" "PlatformCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_communication_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_communication_channels_business_id_status_idx" ON "platform_communication_channels"("business_id", "status");
CREATE INDEX "platform_communication_channels_business_id_type_idx" ON "platform_communication_channels"("business_id", "type");
CREATE UNIQUE INDEX "platform_communication_templates_business_id_slug_key" ON "platform_communication_templates"("business_id", "slug");
CREATE INDEX "platform_communication_templates_business_id_channel_idx" ON "platform_communication_templates"("business_id", "channel");
CREATE INDEX "platform_communication_templates_business_id_status_idx" ON "platform_communication_templates"("business_id", "status");
CREATE INDEX "platform_communication_messages_business_id_status_idx" ON "platform_communication_messages"("business_id", "status");
CREATE INDEX "platform_communication_messages_business_id_channel_created_at_idx" ON "platform_communication_messages"("business_id", "channel", "created_at");
CREATE INDEX "platform_communication_messages_business_id_direction_idx" ON "platform_communication_messages"("business_id", "direction");
CREATE INDEX "platform_communication_campaigns_business_id_status_idx" ON "platform_communication_campaigns"("business_id", "status");
CREATE INDEX "platform_communication_campaigns_business_id_channel_idx" ON "platform_communication_campaigns"("business_id", "channel");

ALTER TABLE "platform_communication_channels" ADD CONSTRAINT "platform_communication_channels_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_communication_templates" ADD CONSTRAINT "platform_communication_templates_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_communication_messages" ADD CONSTRAINT "platform_communication_messages_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_communication_campaigns" ADD CONSTRAINT "platform_communication_campaigns_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
