-- Product management module: menu products and permissions.

DO $$ BEGIN
  CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProductType" AS ENUM ('FOOD', 'DRINK', 'DESSERT', 'COMBO', 'ADDON', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "menu_products" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "short_description" TEXT,
    "image" TEXT,
    "gallery" JSONB NOT NULL DEFAULT '[]',
    "status" "ProductStatus" NOT NULL DEFAULT 'INACTIVE',
    "product_type" "ProductType" NOT NULL DEFAULT 'FOOD',
    "price" DECIMAL(10,2) NOT NULL,
    "cost_price" DECIMAL(10,2),
    "tax_rate" DECIMAL(5,2),
    "preparation_time" INTEGER,
    "calories" INTEGER,
    "allergens" JSONB NOT NULL DEFAULT '[]',
    "ingredients" JSONB NOT NULL DEFAULT '[]',
    "is_vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "is_vegan" BOOLEAN NOT NULL DEFAULT false,
    "is_halal" BOOLEAN NOT NULL DEFAULT false,
    "is_gluten_free" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "track_inventory" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "slug" TEXT NOT NULL,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "menu_products_business_id_sku_key"
  ON "menu_products"("business_id", "sku");

CREATE UNIQUE INDEX IF NOT EXISTS "menu_products_business_id_barcode_key"
  ON "menu_products"("business_id", "barcode");

CREATE UNIQUE INDEX IF NOT EXISTS "menu_products_business_id_slug_key"
  ON "menu_products"("business_id", "slug");

CREATE INDEX IF NOT EXISTS "menu_products_business_id_status_idx"
  ON "menu_products"("business_id", "status");

CREATE INDEX IF NOT EXISTS "menu_products_business_id_category_id_idx"
  ON "menu_products"("business_id", "category_id");

CREATE INDEX IF NOT EXISTS "menu_products_category_id_display_order_idx"
  ON "menu_products"("category_id", "display_order");

DO $$ BEGIN
  ALTER TABLE "menu_products" ADD CONSTRAINT "menu_products_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "menu_products" ADD CONSTRAINT "menu_products_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'product.view', 'View Products', 'View menu products and catalog', 'product', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'product.create', 'Create Products', 'Create menu products', 'product', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'product.update', 'Update Products', 'Update menu products', 'product', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'product.delete', 'Delete Products', 'Delete or archive menu products', 'product', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'product.publish', 'Publish Products', 'Publish products for guest-facing menus', 'product', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'product.import', 'Import Products', 'Bulk import menu products', 'product', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'product.export', 'Export Products', 'Bulk export menu products', 'product', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
