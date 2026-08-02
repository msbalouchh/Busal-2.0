-- Category management module: menu-scoped categories and permissions.

DO $$ BEGIN
  CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "menu_categories" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "menu_id" TEXT NOT NULL,
    "parent_category_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "icon" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT NOT NULL,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "menu_categories_menu_id_name_key"
  ON "menu_categories"("menu_id", "name");

CREATE UNIQUE INDEX IF NOT EXISTS "menu_categories_menu_id_slug_key"
  ON "menu_categories"("menu_id", "slug");

CREATE INDEX IF NOT EXISTS "menu_categories_business_id_menu_id_status_idx"
  ON "menu_categories"("business_id", "menu_id", "status");

CREATE INDEX IF NOT EXISTS "menu_categories_menu_id_parent_category_id_idx"
  ON "menu_categories"("menu_id", "parent_category_id");

DO $$ BEGIN
  ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_menu_id_fkey"
    FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_parent_category_id_fkey"
    FOREIGN KEY ("parent_category_id") REFERENCES "menu_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'category.view', 'View Categories', 'View menu categories and hierarchy', 'category', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'category.create', 'Create Categories', 'Create menu categories', 'category', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'category.update', 'Update Categories', 'Update menu categories and ordering', 'category', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'category.delete', 'Delete Categories', 'Delete or archive menu categories', 'category', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'category.publish', 'Publish Categories', 'Publish categories for guest-facing menus', 'category', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
