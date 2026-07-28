-- Notification permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'notifications.view', 'View Notifications', 'View notification inbox and delivery dashboard', 'notifications', NOW(), NOW()),
  (gen_random_uuid(), 'notifications.admin', 'Administer Notifications', 'Full notification hub administration', 'notifications', NOW(), NOW()),
  (gen_random_uuid(), 'notifications.manage_templates', 'Manage Templates', 'Create and manage notification templates', 'notifications', NOW(), NOW()),
  (gen_random_uuid(), 'notifications.manage_rules', 'Manage Delivery Rules', 'Configure notification delivery rules', 'notifications', NOW(), NOW()),
  (gen_random_uuid(), 'notifications.manage_channels', 'Manage Channels', 'Configure notification channels', 'notifications', NOW(), NOW()),
  (gen_random_uuid(), 'notifications.manage_preferences', 'Manage Preferences', 'Manage notification user preferences', 'notifications', NOW(), NOW()),
  (gen_random_uuid(), 'notifications.publish', 'Publish Notifications', 'Publish notification events through the hub', 'notifications', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH', 'WHATSAPP', 'WEBHOOK', 'SLACK', 'TEAMS', 'DISCORD');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('ORDERS', 'RESERVATIONS', 'INVENTORY', 'COMMERCIAL', 'REVENUE', 'AI', 'MARKETING', 'CRM', 'SUPPORT', 'SECURITY', 'SYSTEM', 'MARKETPLACE');

-- CreateEnum
CREATE TYPE "NotificationDeliveryMode" AS ENUM ('IMMEDIATE', 'SCHEDULED', 'DIGEST', 'RETRY');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationInboxStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED', 'PINNED');

-- CreateEnum
CREATE TYPE "NotificationTemplateType" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'WHATSAPP', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationDigestFrequency" AS ENUM ('NONE', 'HOURLY', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "NotificationAuditEventType" AS ENUM ('PUBLISHED', 'QUEUED', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'FAILED', 'RETRIED', 'PREFERENCE_UPDATED', 'TEMPLATE_CREATED', 'RULE_CREATED');

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "slug" TEXT NOT NULL,
    "template_type" "NotificationTemplateType" NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_delivery_rules" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "name" TEXT NOT NULL,
    "mode" "NotificationDeliveryMode" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "category" "NotificationCategory",
    "channel" "NotificationChannel",
    "silent" BOOLEAN NOT NULL DEFAULT false,
    "business_hours_only" BOOLEAN NOT NULL DEFAULT false,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "retry_delay_minutes" INTEGER NOT NULL DEFAULT 5,
    "digest_frequency" "NotificationDigestFrequency" NOT NULL DEFAULT 'NONE',
    "schedule_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_delivery_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "enabled_channels" "NotificationChannel"[] DEFAULT ARRAY['IN_APP', 'EMAIL']::"NotificationChannel"[],
    "quiet_hours_start" TEXT,
    "quiet_hours_end" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "disabled_categories" "NotificationCategory"[] DEFAULT ARRAY[]::"NotificationCategory"[],
    "digest_frequency" "NotificationDigestFrequency" NOT NULL DEFAULT 'DAILY',
    "category_overrides" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "triggered_by_user_id" TEXT,
    "triggered_by_module" TEXT NOT NULL,
    "template_id" TEXT,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "recipient_user_id" TEXT,
    "recipient_email" TEXT,
    "recipient_phone" TEXT,
    "template_id" TEXT,
    "delivery_rule_id" TEXT,
    "rendered_subject" TEXT,
    "rendered_body" TEXT,
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "delivery_time_ms" INTEGER,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_inbox_items" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "status" "NotificationInboxStatus" NOT NULL DEFAULT 'UNREAD',
    "read_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "pinned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_inbox_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "notification_id" TEXT,
    "delivery_id" TEXT,
    "event_type" "NotificationAuditEventType" NOT NULL,
    "triggered_by_user_id" TEXT,
    "recipient_user_id" TEXT,
    "channel" "NotificationChannel",
    "template_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_channel_configs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_channel_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_business_id_slug_locale_version_key" ON "notification_templates"("business_id", "slug", "locale", "version");

-- CreateIndex
CREATE INDEX "notification_templates_business_id_category_is_active_idx" ON "notification_templates"("business_id", "category", "is_active");

-- CreateIndex
CREATE INDEX "notification_delivery_rules_business_id_category_is_active_idx" ON "notification_delivery_rules"("business_id", "category", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "notification_user_preferences_user_id_business_id_key" ON "notification_user_preferences"("user_id", "business_id");

-- CreateIndex
CREATE INDEX "notification_user_preferences_business_id_idx" ON "notification_user_preferences"("business_id");

-- CreateIndex
CREATE INDEX "notifications_business_id_category_created_at_idx" ON "notifications"("business_id", "category", "created_at");

-- CreateIndex
CREATE INDEX "notification_deliveries_business_id_status_channel_idx" ON "notification_deliveries"("business_id", "status", "channel");

-- CreateIndex
CREATE INDEX "notification_deliveries_notification_id_idx" ON "notification_deliveries"("notification_id");

-- CreateIndex
CREATE INDEX "notification_deliveries_recipient_user_id_status_idx" ON "notification_deliveries"("recipient_user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "notification_inbox_items_notification_id_user_id_key" ON "notification_inbox_items"("notification_id", "user_id");

-- CreateIndex
CREATE INDEX "notification_inbox_items_user_id_business_id_status_idx" ON "notification_inbox_items"("user_id", "business_id", "status");

-- CreateIndex
CREATE INDEX "notification_audit_logs_business_id_created_at_idx" ON "notification_audit_logs"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_audit_logs_notification_id_idx" ON "notification_audit_logs"("notification_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_channel_configs_business_id_channel_key" ON "notification_channel_configs"("business_id", "channel");

-- CreateIndex
CREATE INDEX "notification_channel_configs_business_id_is_enabled_idx" ON "notification_channel_configs"("business_id", "is_enabled");

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery_rules" ADD CONSTRAINT "notification_delivery_rules_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_user_preferences" ADD CONSTRAINT "notification_user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_user_preferences" ADD CONSTRAINT "notification_user_preferences_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_inbox_items" ADD CONSTRAINT "notification_inbox_items_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_inbox_items" ADD CONSTRAINT "notification_inbox_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_inbox_items" ADD CONSTRAINT "notification_inbox_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_audit_logs" ADD CONSTRAINT "notification_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_audit_logs" ADD CONSTRAINT "notification_audit_logs_triggered_by_user_id_fkey" FOREIGN KEY ("triggered_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_channel_configs" ADD CONSTRAINT "notification_channel_configs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
