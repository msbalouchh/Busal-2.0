-- Localization Platform permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'localization_platform.view', 'View Localization Platform', 'View languages, translations, and regional settings', 'localization_platform', NOW(), NOW()),
  (gen_random_uuid(), 'localization_platform.manage', 'Manage Localization Platform', 'Manage translations and language preferences', 'localization_platform', NOW(), NOW()),
  (gen_random_uuid(), 'localization_platform.admin', 'Administer Localization Platform', 'Full localization platform administration', 'localization_platform', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "LocalizationTextDirection" AS ENUM ('LTR', 'RTL');

-- CreateEnum
CREATE TYPE "LocalizationScopeType" AS ENUM ('USER', 'BUSINESS', 'BRANCH');

-- CreateEnum
CREATE TYPE "LocalizationAuditEventType" AS ENUM ('TRANSLATION_CREATED', 'TRANSLATION_UPDATED', 'VERSION_PUBLISHED', 'LANGUAGE_REGISTERED', 'PREFERENCE_UPDATED', 'PACK_LOADED', 'DASHBOARD_ACCESS', 'KEY_REGISTERED');

-- CreateTable
CREATE TABLE "localization_languages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "native_name" TEXT NOT NULL,
    "direction" "LocalizationTextDirection" NOT NULL DEFAULT 'LTR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_fallback" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "localization_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "localization_translation_keys" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "default_value" TEXT NOT NULL,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "localization_translation_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "localization_translations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "key_id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "localization_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "localization_translation_versions" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "key_id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "change_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "localization_translation_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "localization_scope_settings" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "scope_type" "LocalizationScopeType" NOT NULL,
    "scope_identifier" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "fallback_language_code" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "date_format" TEXT NOT NULL DEFAULT 'yyyy-MM-dd',
    "time_format" TEXT NOT NULL DEFAULT 'HH:mm',
    "number_format" TEXT NOT NULL DEFAULT 'en-US',
    "currency_code" TEXT NOT NULL DEFAULT 'USD',
    "country_code" TEXT NOT NULL DEFAULT 'US',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "localization_scope_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "localization_platform_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "user_id" TEXT,
    "event_type" "LocalizationAuditEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "localization_platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "localization_languages_code_key" ON "localization_languages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "localization_translation_keys_business_id_key_key" ON "localization_translation_keys"("business_id", "key");

-- CreateIndex
CREATE INDEX "localization_translation_keys_module_idx" ON "localization_translation_keys"("module");

-- CreateIndex
CREATE UNIQUE INDEX "localization_translations_business_id_key_id_language_code_key" ON "localization_translations"("business_id", "key_id", "language_code");

-- CreateIndex
CREATE INDEX "localization_translations_language_code_idx" ON "localization_translations"("language_code");

-- CreateIndex
CREATE UNIQUE INDEX "localization_translation_versions_key_id_language_code_version_key" ON "localization_translation_versions"("key_id", "language_code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "localization_scope_settings_business_id_scope_type_scope_identifier_key" ON "localization_scope_settings"("business_id", "scope_type", "scope_identifier");

-- CreateIndex
CREATE INDEX "localization_platform_audit_logs_business_id_event_type_created_at_idx" ON "localization_platform_audit_logs"("business_id", "event_type", "created_at");

-- AddForeignKey
ALTER TABLE "localization_translation_keys" ADD CONSTRAINT "localization_translation_keys_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localization_translations" ADD CONSTRAINT "localization_translations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localization_translations" ADD CONSTRAINT "localization_translations_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "localization_translation_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localization_translations" ADD CONSTRAINT "localization_translations_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "localization_languages"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localization_translation_versions" ADD CONSTRAINT "localization_translation_versions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localization_translation_versions" ADD CONSTRAINT "localization_translation_versions_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "localization_translation_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localization_scope_settings" ADD CONSTRAINT "localization_scope_settings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localization_platform_audit_logs" ADD CONSTRAINT "localization_platform_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localization_platform_audit_logs" ADD CONSTRAINT "localization_platform_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed initial languages
INSERT INTO "localization_languages" ("id", "code", "name", "native_name", "direction", "is_active", "is_fallback", "created_at", "updated_at")
VALUES
  (gen_random_uuid()::text, 'en', 'English', 'English', 'LTR', true, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ar', 'Arabic', 'العربية', 'RTL', true, false, NOW(), NOW()),
  (gen_random_uuid()::text, 'ur', 'Urdu', 'اردو', 'RTL', true, false, NOW(), NOW()),
  (gen_random_uuid()::text, 'fr', 'French', 'Français', 'LTR', true, false, NOW(), NOW()),
  (gen_random_uuid()::text, 'es', 'Spanish', 'Español', 'LTR', true, false, NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
