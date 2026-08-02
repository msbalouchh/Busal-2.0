-- Busal App Marketplace & Extension Platform

CREATE TYPE "PlatformMarketplaceAppStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'DISABLED', 'ARCHIVED');
CREATE TYPE "PlatformMarketplaceInstallStatus" AS ENUM ('INSTALLED', 'DISABLED', 'PENDING', 'FAILED');
CREATE TYPE "PlatformMarketplacePricingModel" AS ENUM ('FREE', 'PAID', 'SUBSCRIPTION', 'ENTERPRISE');

CREATE TABLE "platform_marketplace_apps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "developer" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'business',
    "current_version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" "PlatformMarketplaceAppStatus" NOT NULL DEFAULT 'DRAFT',
    "icon" TEXT NOT NULL DEFAULT '',
    "banner" TEXT NOT NULL DEFAULT '',
    "pricing_model" "PlatformMarketplacePricingModel" NOT NULL DEFAULT 'FREE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_marketplace_apps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_installed_apps" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" "PlatformMarketplaceInstallStatus" NOT NULL DEFAULT 'PENDING',
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_installed_apps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_marketplace_app_versions" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "release_notes" TEXT NOT NULL DEFAULT '',
    "download_url" TEXT NOT NULL DEFAULT '',
    "checksum" TEXT NOT NULL DEFAULT '',
    "status" "PlatformMarketplaceAppStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),

    CONSTRAINT "platform_marketplace_app_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_marketplace_app_reviews" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_marketplace_app_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_marketplace_apps_slug_key" ON "platform_marketplace_apps"("slug");
CREATE INDEX "platform_marketplace_apps_status_category_idx" ON "platform_marketplace_apps"("status", "category");
CREATE UNIQUE INDEX "platform_installed_apps_business_id_app_id_key" ON "platform_installed_apps"("business_id", "app_id");
CREATE INDEX "platform_installed_apps_business_id_status_idx" ON "platform_installed_apps"("business_id", "status");
CREATE UNIQUE INDEX "platform_marketplace_app_versions_app_id_version_key" ON "platform_marketplace_app_versions"("app_id", "version");
CREATE INDEX "platform_marketplace_app_versions_app_id_status_idx" ON "platform_marketplace_app_versions"("app_id", "status");
CREATE UNIQUE INDEX "platform_marketplace_app_reviews_app_id_business_id_key" ON "platform_marketplace_app_reviews"("app_id", "business_id");
CREATE INDEX "platform_marketplace_app_reviews_app_id_rating_idx" ON "platform_marketplace_app_reviews"("app_id", "rating");

ALTER TABLE "platform_installed_apps" ADD CONSTRAINT "platform_installed_apps_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_installed_apps" ADD CONSTRAINT "platform_installed_apps_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "platform_marketplace_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_marketplace_app_versions" ADD CONSTRAINT "platform_marketplace_app_versions_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "platform_marketplace_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_marketplace_app_reviews" ADD CONSTRAINT "platform_marketplace_app_reviews_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "platform_marketplace_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_marketplace_app_reviews" ADD CONSTRAINT "platform_marketplace_app_reviews_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
