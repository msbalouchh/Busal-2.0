-- Commercial catalogue permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'commercial.view', 'View Commercial Catalogue', 'View commercial products, bundles, and price books', 'commercial', NOW(), NOW()),
  (gen_random_uuid(), 'commercial.create', 'Create Commercial Items', 'Create commercial catalogue items', 'commercial', NOW(), NOW()),
  (gen_random_uuid(), 'commercial.update', 'Update Commercial Items', 'Update commercial catalogue items', 'commercial', NOW(), NOW()),
  (gen_random_uuid(), 'commercial.archive', 'Archive Commercial Items', 'Archive commercial catalogue items', 'commercial', NOW(), NOW()),
  (gen_random_uuid(), 'commercial.manage_prices', 'Manage Commercial Prices', 'Manage price books and pricing', 'commercial', NOW(), NOW()),
  (gen_random_uuid(), 'commercial.manage_bundles', 'Manage Commercial Bundles', 'Manage product bundles', 'commercial', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Enums
CREATE TYPE "CommercialProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "CommercialPricingModel" AS ENUM ('ONE_TIME', 'MONTHLY', 'ANNUAL', 'USAGE_BASED', 'CUSTOM');
CREATE TYPE "CommercialBillingCycle" AS ENUM ('ONE_TIME', 'MONTHLY', 'ANNUAL', 'CUSTOM');
CREATE TYPE "PriceBookType" AS ENUM ('STANDARD', 'PROMOTIONAL', 'ENTERPRISE', 'COUNTRY_SPECIFIC', 'PARTNER_SPECIFIC');

-- Tables
CREATE TABLE "commercial_categories" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "commercial_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commercial_products" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "category_id" TEXT,
    "sku" TEXT NOT NULL,
    "status" "CommercialProductStatus" NOT NULL DEFAULT 'DRAFT',
    "current_version_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "commercial_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commercial_product_versions" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricing_model" "CommercialPricingModel" NOT NULL,
    "base_price_pence" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "tax_class" TEXT,
    "industry" TEXT,
    "setup_required" BOOLEAN NOT NULL DEFAULT false,
    "requires_contract" BOOLEAN NOT NULL DEFAULT false,
    "renewable" BOOLEAN NOT NULL DEFAULT false,
    "default_billing_cycle" "CommercialBillingCycle",
    "estimated_delivery_time" TEXT,
    "assigned_department" TEXT,
    "service_checklist_template" TEXT,
    "documentation" TEXT,
    "created_by_staff_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commercial_product_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commercial_bundles" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "status" "CommercialProductStatus" NOT NULL DEFAULT 'DRAFT',
    "current_version_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "commercial_bundles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commercial_bundle_versions" (
    "id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "bundle_price_pence" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "pricing_model" "CommercialPricingModel" NOT NULL DEFAULT 'ONE_TIME',
    "created_by_staff_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commercial_bundle_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commercial_bundle_items" (
    "id" TEXT NOT NULL,
    "bundle_version_id" TEXT NOT NULL,
    "product_version_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "individual_price_pence" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "commercial_bundle_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "price_books" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PriceBookType" NOT NULL,
    "status" "CommercialProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_version_id" TEXT,
    "country_code" TEXT,
    "partner_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "price_books_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "price_book_versions" (
    "id" TEXT NOT NULL,
    "price_book_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "created_by_staff_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "price_book_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "price_book_entries" (
    "id" TEXT NOT NULL,
    "price_book_version_id" TEXT NOT NULL,
    "product_version_id" TEXT,
    "bundle_version_id" TEXT,
    "price_pence" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "pricing_model" "CommercialPricingModel",
    CONSTRAINT "price_book_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commercial_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commercial_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Uniques and indexes
CREATE UNIQUE INDEX "commercial_categories_business_id_slug_key" ON "commercial_categories"("business_id", "slug");
CREATE UNIQUE INDEX "commercial_products_business_id_sku_key" ON "commercial_products"("business_id", "sku");
CREATE UNIQUE INDEX "commercial_products_current_version_id_key" ON "commercial_products"("current_version_id");
CREATE UNIQUE INDEX "commercial_product_versions_product_id_version_number_key" ON "commercial_product_versions"("product_id", "version_number");
CREATE UNIQUE INDEX "commercial_bundles_business_id_sku_key" ON "commercial_bundles"("business_id", "sku");
CREATE UNIQUE INDEX "commercial_bundles_current_version_id_key" ON "commercial_bundles"("current_version_id");
CREATE UNIQUE INDEX "commercial_bundle_versions_bundle_id_version_number_key" ON "commercial_bundle_versions"("bundle_id", "version_number");
CREATE UNIQUE INDEX "price_books_business_id_code_key" ON "price_books"("business_id", "code");
CREATE UNIQUE INDEX "price_books_current_version_id_key" ON "price_books"("current_version_id");
CREATE UNIQUE INDEX "price_book_versions_price_book_id_version_number_key" ON "price_book_versions"("price_book_id", "version_number");
CREATE INDEX "commercial_products_business_id_status_idx" ON "commercial_products"("business_id", "status");
CREATE INDEX "commercial_bundles_business_id_status_idx" ON "commercial_bundles"("business_id", "status");
CREATE INDEX "price_books_business_id_type_idx" ON "price_books"("business_id", "type");

-- Foreign keys
ALTER TABLE "commercial_categories" ADD CONSTRAINT "commercial_categories_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commercial_products" ADD CONSTRAINT "commercial_products_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commercial_products" ADD CONSTRAINT "commercial_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "commercial_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commercial_product_versions" ADD CONSTRAINT "commercial_product_versions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "commercial_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commercial_product_versions" ADD CONSTRAINT "commercial_product_versions_created_by_staff_id_fkey" FOREIGN KEY ("created_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commercial_products" ADD CONSTRAINT "commercial_products_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "commercial_product_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commercial_bundles" ADD CONSTRAINT "commercial_bundles_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commercial_bundle_versions" ADD CONSTRAINT "commercial_bundle_versions_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "commercial_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commercial_bundle_versions" ADD CONSTRAINT "commercial_bundle_versions_created_by_staff_id_fkey" FOREIGN KEY ("created_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commercial_bundles" ADD CONSTRAINT "commercial_bundles_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "commercial_bundle_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commercial_bundle_items" ADD CONSTRAINT "commercial_bundle_items_bundle_version_id_fkey" FOREIGN KEY ("bundle_version_id") REFERENCES "commercial_bundle_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commercial_bundle_items" ADD CONSTRAINT "commercial_bundle_items_product_version_id_fkey" FOREIGN KEY ("product_version_id") REFERENCES "commercial_product_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_books" ADD CONSTRAINT "price_books_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_book_versions" ADD CONSTRAINT "price_book_versions_price_book_id_fkey" FOREIGN KEY ("price_book_id") REFERENCES "price_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_book_versions" ADD CONSTRAINT "price_book_versions_created_by_staff_id_fkey" FOREIGN KEY ("created_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_books" ADD CONSTRAINT "price_books_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "price_book_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_book_entries" ADD CONSTRAINT "price_book_entries_price_book_version_id_fkey" FOREIGN KEY ("price_book_version_id") REFERENCES "price_book_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_book_entries" ADD CONSTRAINT "price_book_entries_product_version_id_fkey" FOREIGN KEY ("product_version_id") REFERENCES "commercial_product_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_book_entries" ADD CONSTRAINT "price_book_entries_bundle_version_id_fkey" FOREIGN KEY ("bundle_version_id") REFERENCES "commercial_bundle_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commercial_audit_logs" ADD CONSTRAINT "commercial_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commercial_audit_logs" ADD CONSTRAINT "commercial_audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
