-- Communication Center permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'communication.view', 'View Communication', 'View omnichannel inbox and conversations', 'communication', NOW(), NOW()),
  (gen_random_uuid(), 'communication.reply', 'Reply to Conversations', 'Send replies in customer conversations', 'communication', NOW(), NOW()),
  (gen_random_uuid(), 'communication.assign', 'Assign Conversations', 'Assign and reassign conversations', 'communication', NOW(), NOW()),
  (gen_random_uuid(), 'communication.manage', 'Manage Communication', 'Manage communication settings and inboxes', 'communication', NOW(), NOW()),
  (gen_random_uuid(), 'communication.admin', 'Administer Communication', 'Full communication center administration', 'communication', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS', 'LIVE_CHAT', 'FACEBOOK_MESSENGER', 'INSTAGRAM_DIRECT', 'WEB_CONTACT_FORM');

-- CreateEnum
CREATE TYPE "CommunicationConversationStatus" AS ENUM ('OPEN', 'WAITING_CUSTOMER', 'WAITING_STAFF', 'AI_HANDLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CommunicationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CommunicationInboxType" AS ENUM ('PERSONAL', 'TEAM', 'DEPARTMENT', 'AI');

-- CreateEnum
CREATE TYPE "CommunicationMessageType" AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL_NOTE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CommunicationDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "CommunicationSenderType" AS ENUM ('CUSTOMER', 'STAFF', 'AI_AGENT', 'SYSTEM', 'CONTACT');

-- CreateEnum
CREATE TYPE "CommunicationAttachmentType" AS ENUM ('IMAGE', 'PDF', 'OFFICE_DOCUMENT', 'AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "CommunicationAiActionType" AS ENUM ('SUMMARIZE', 'DRAFT_REPLY', 'SUGGEST_RESPONSE', 'CLASSIFY', 'SENTIMENT', 'RECOMMEND_ACTION', 'ESCALATE');

-- CreateEnum
CREATE TYPE "CommunicationAuditEventType" AS ENUM ('CREATED', 'ASSIGNED', 'REASSIGNED', 'REPLIED', 'NOTE_ADDED', 'CLOSED', 'REOPENED', 'AI_ACTION', 'ATTACHMENT_ADDED');

-- CreateTable
CREATE TABLE "communication_contacts" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_channel_connectors" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "channel" "CommunicationChannel" NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_channel_connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_conversations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "customer_id" TEXT,
    "contact_id" TEXT,
    "assigned_staff_id" TEXT,
    "assigned_ai_agent_id" TEXT,
    "status" "CommunicationConversationStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "CommunicationPriority" NOT NULL DEFAULT 'NORMAL',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source_channel" "CommunicationChannel" NOT NULL,
    "inbox_type" "CommunicationInboxType" NOT NULL DEFAULT 'TEAM',
    "department" TEXT,
    "team_slug" TEXT,
    "subject" TEXT,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "message_type" "CommunicationMessageType" NOT NULL,
    "sender_type" "CommunicationSenderType" NOT NULL,
    "sender_staff_id" TEXT,
    "sender_ai_agent_id" TEXT,
    "sender_contact_id" TEXT,
    "sender_customer_id" TEXT,
    "recipient_staff_id" TEXT,
    "channel" "CommunicationChannel" NOT NULL,
    "body" TEXT NOT NULL,
    "subject" TEXT,
    "delivery_status" "CommunicationDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_message_attachments" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "attachment_type" "CommunicationAttachmentType" NOT NULL,
    "file_size_bytes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_activity_logs" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "event_type" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_ai_insights" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "ai_agent_id" TEXT,
    "action_type" "CommunicationAiActionType" NOT NULL,
    "result" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "approved_by_staff_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "message_id" TEXT,
    "event_type" "CommunicationAuditEventType" NOT NULL,
    "staff_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communication_contacts_business_id_email_idx" ON "communication_contacts"("business_id", "email");

-- CreateIndex
CREATE INDEX "communication_contacts_business_id_phone_idx" ON "communication_contacts"("business_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "communication_channel_connectors_business_id_channel_key" ON "communication_channel_connectors"("business_id", "channel");

-- CreateIndex
CREATE INDEX "communication_channel_connectors_business_id_is_enabled_idx" ON "communication_channel_connectors"("business_id", "is_enabled");

-- CreateIndex
CREATE INDEX "communication_conversations_business_id_status_last_message__idx" ON "communication_conversations"("business_id", "status", "last_message_at");

-- CreateIndex
CREATE INDEX "communication_conversations_business_id_assigned_staff_id_s_idx" ON "communication_conversations"("business_id", "assigned_staff_id", "status");

-- CreateIndex
CREATE INDEX "communication_conversations_business_id_inbox_type_status_idx" ON "communication_conversations"("business_id", "inbox_type", "status");

-- CreateIndex
CREATE INDEX "communication_conversations_business_id_source_channel_idx" ON "communication_conversations"("business_id", "source_channel");

-- CreateIndex
CREATE INDEX "communication_messages_conversation_id_created_at_idx" ON "communication_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "communication_messages_business_id_channel_created_at_idx" ON "communication_messages"("business_id", "channel", "created_at");

-- CreateIndex
CREATE INDEX "communication_message_attachments_message_id_idx" ON "communication_message_attachments"("message_id");

-- CreateIndex
CREATE INDEX "communication_message_attachments_business_id_storage_key_idx" ON "communication_message_attachments"("business_id", "storage_key");

-- CreateIndex
CREATE INDEX "communication_activity_logs_conversation_id_created_at_idx" ON "communication_activity_logs"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "communication_ai_insights_conversation_id_action_type_idx" ON "communication_ai_insights"("conversation_id", "action_type");

-- CreateIndex
CREATE INDEX "communication_audit_logs_business_id_created_at_idx" ON "communication_audit_logs"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "communication_audit_logs_conversation_id_idx" ON "communication_audit_logs"("conversation_id");

-- AddForeignKey
ALTER TABLE "communication_contacts" ADD CONSTRAINT "communication_contacts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_contacts" ADD CONSTRAINT "communication_contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_channel_connectors" ADD CONSTRAINT "communication_channel_connectors_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_conversations" ADD CONSTRAINT "communication_conversations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_conversations" ADD CONSTRAINT "communication_conversations_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_conversations" ADD CONSTRAINT "communication_conversations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_conversations" ADD CONSTRAINT "communication_conversations_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "communication_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_conversations" ADD CONSTRAINT "communication_conversations_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_conversations" ADD CONSTRAINT "communication_conversations_assigned_ai_agent_id_fkey" FOREIGN KEY ("assigned_ai_agent_id") REFERENCES "ai_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "communication_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_sender_staff_id_fkey" FOREIGN KEY ("sender_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_message_attachments" ADD CONSTRAINT "communication_message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "communication_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_message_attachments" ADD CONSTRAINT "communication_message_attachments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_activity_logs" ADD CONSTRAINT "communication_activity_logs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "communication_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_activity_logs" ADD CONSTRAINT "communication_activity_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_activity_logs" ADD CONSTRAINT "communication_activity_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_ai_insights" ADD CONSTRAINT "communication_ai_insights_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "communication_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_ai_insights" ADD CONSTRAINT "communication_ai_insights_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_ai_insights" ADD CONSTRAINT "communication_ai_insights_ai_agent_id_fkey" FOREIGN KEY ("ai_agent_id") REFERENCES "ai_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_audit_logs" ADD CONSTRAINT "communication_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_audit_logs" ADD CONSTRAINT "communication_audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
