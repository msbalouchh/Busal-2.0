-- Marketplace permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'marketplace.view', 'View Marketplace', 'Browse marketplace catalogue and installed extensions', 'marketplace', NOW(), NOW()),
  (gen_random_uuid(), 'marketplace.install', 'Install Marketplace Items', 'Install, update, rollback, and uninstall extensions', 'marketplace', NOW(), NOW()),
  (gen_random_uuid(), 'marketplace.purchase', 'Purchase Marketplace Items', 'Purchase paid marketplace extensions', 'marketplace', NOW(), NOW()),
  (gen_random_uuid(), 'marketplace.publish', 'Publish Marketplace Items', 'Publish and manage marketplace extensions as a publisher', 'marketplace', NOW(), NOW()),
  (gen_random_uuid(), 'marketplace.admin', 'Administer Marketplace', 'Full marketplace platform administration', 'marketplace', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "MarketplaceCategory" AS ENUM ('AI_AGENTS', 'INTEGRATIONS', 'INDUSTRY_PACKS', 'THEMES', 'WORKFLOW_PACKS', 'DASHBOARD_PACKS', 'REPORT_PACKS', 'DOCUMENT_TEMPLATES', 'PLUGINS');

-- CreateEnum
CREATE TYPE "MarketplacePricingType" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "MarketplaceLicenseType" AS ENUM ('FREE', 'TRIAL', 'MONTHLY', 'ANNUAL', 'LIFETIME', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "MarketplaceItemStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MarketplaceInstallAction" AS ENUM ('INSTALL', 'UPDATE', 'ROLLBACK', 'UNINSTALL');

-- CreateEnum
CREATE TYPE "MarketplaceInstallStatus" AS ENUM ('INSTALLED', 'UPDATING', 'FAILED', 'UNINSTALLED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "MarketplaceLicenseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'TRIAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MarketplaceRevenueBillingType" AS ENUM ('ONE_TIME', 'SUBSCRIPTION', 'USAGE');

-- CreateTable
CREATE TABLE "marketplace_publishers" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contact_email" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "total_downloads" INTEGER NOT NULL DEFAULT 0,
    "total_revenue_cents" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_publishers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_items" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "MarketplaceCategory" NOT NULL,
    "publisher_id" TEXT NOT NULL,
    "current_version_id" TEXT,
    "pricing_type" "MarketplacePricingType" NOT NULL DEFAULT 'FREE',
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "license_type" "MarketplaceLicenseType" NOT NULL DEFAULT 'FREE',
    "screenshots" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "compatibility" JSONB,
    "dependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "permissions_required" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "average_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "status" "MarketplaceItemStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_item_versions" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "version_label" TEXT NOT NULL,
    "changelog" TEXT,
    "package_config" JSONB,
    "min_busal_version" TEXT,
    "required_modules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "required_industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requires_ai" BOOLEAN NOT NULL DEFAULT false,
    "status" "MarketplaceItemStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "deprecated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_item_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_installations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "status" "MarketplaceInstallStatus" NOT NULL DEFAULT 'INSTALLED',
    "previous_version_id" TEXT,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_installation_history" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "installation_id" TEXT,
    "item_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "from_version_id" TEXT,
    "action" "MarketplaceInstallAction" NOT NULL,
    "status" "MarketplaceInstallStatus" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_installation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_licenses" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "license_type" "MarketplaceLicenseType" NOT NULL,
    "status" "MarketplaceLicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_reviews" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_issue_reports" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "review_id" TEXT,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_issue_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_revenue_records" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "publisher_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "commission_cents" INTEGER NOT NULL DEFAULT 0,
    "revenue_share_cents" INTEGER NOT NULL DEFAULT 0,
    "billing_type" "MarketplaceRevenueBillingType" NOT NULL,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_revenue_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_publishers_slug_key" ON "marketplace_publishers"("slug");

-- CreateIndex
CREATE INDEX "marketplace_publishers_verified_idx" ON "marketplace_publishers"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_items_slug_key" ON "marketplace_items"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_items_current_version_id_key" ON "marketplace_items"("current_version_id");

-- CreateIndex
CREATE INDEX "marketplace_items_category_status_idx" ON "marketplace_items"("category", "status");

-- CreateIndex
CREATE INDEX "marketplace_items_publisher_id_idx" ON "marketplace_items"("publisher_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_item_versions_item_id_version_number_key" ON "marketplace_item_versions"("item_id", "version_number");

-- CreateIndex
CREATE INDEX "marketplace_item_versions_item_id_status_idx" ON "marketplace_item_versions"("item_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_installations_business_id_item_id_key" ON "marketplace_installations"("business_id", "item_id");

-- CreateIndex
CREATE INDEX "marketplace_installations_business_id_status_idx" ON "marketplace_installations"("business_id", "status");

-- CreateIndex
CREATE INDEX "marketplace_installation_history_business_id_created_at_idx" ON "marketplace_installation_history"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_installation_history_item_id_idx" ON "marketplace_installation_history"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_licenses_business_id_item_id_key" ON "marketplace_licenses"("business_id", "item_id");

-- CreateIndex
CREATE INDEX "marketplace_licenses_business_id_status_idx" ON "marketplace_licenses"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_reviews_business_id_item_id_key" ON "marketplace_reviews"("business_id", "item_id");

-- CreateIndex
CREATE INDEX "marketplace_reviews_item_id_rating_idx" ON "marketplace_reviews"("item_id", "rating");

-- CreateIndex
CREATE INDEX "marketplace_issue_reports_business_id_status_idx" ON "marketplace_issue_reports"("business_id", "status");

-- CreateIndex
CREATE INDEX "marketplace_issue_reports_item_id_idx" ON "marketplace_issue_reports"("item_id");

-- CreateIndex
CREATE INDEX "marketplace_revenue_records_business_id_created_at_idx" ON "marketplace_revenue_records"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_revenue_records_publisher_id_idx" ON "marketplace_revenue_records"("publisher_id");

-- CreateIndex
CREATE INDEX "marketplace_audit_logs_business_id_created_at_idx" ON "marketplace_audit_logs"("business_id", "created_at");

-- AddForeignKey
ALTER TABLE "marketplace_publishers" ADD CONSTRAINT "marketplace_publishers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_items" ADD CONSTRAINT "marketplace_items_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "marketplace_publishers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_items" ADD CONSTRAINT "marketplace_items_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "marketplace_item_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_item_versions" ADD CONSTRAINT "marketplace_item_versions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "marketplace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_installations" ADD CONSTRAINT "marketplace_installations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_installations" ADD CONSTRAINT "marketplace_installations_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "marketplace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_installations" ADD CONSTRAINT "marketplace_installations_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "marketplace_item_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_installation_history" ADD CONSTRAINT "marketplace_installation_history_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_installation_history" ADD CONSTRAINT "marketplace_installation_history_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "marketplace_installations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_installation_history" ADD CONSTRAINT "marketplace_installation_history_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "marketplace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_installation_history" ADD CONSTRAINT "marketplace_installation_history_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "marketplace_item_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_licenses" ADD CONSTRAINT "marketplace_licenses_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_licenses" ADD CONSTRAINT "marketplace_licenses_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "marketplace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "marketplace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_issue_reports" ADD CONSTRAINT "marketplace_issue_reports_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_issue_reports" ADD CONSTRAINT "marketplace_issue_reports_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "marketplace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_issue_reports" ADD CONSTRAINT "marketplace_issue_reports_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "marketplace_reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_revenue_records" ADD CONSTRAINT "marketplace_revenue_records_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_revenue_records" ADD CONSTRAINT "marketplace_revenue_records_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "marketplace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_revenue_records" ADD CONSTRAINT "marketplace_revenue_records_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "marketplace_publishers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_audit_logs" ADD CONSTRAINT "marketplace_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
