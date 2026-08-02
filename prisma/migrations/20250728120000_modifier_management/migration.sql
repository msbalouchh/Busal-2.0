-- Modifier management module: menu modifier groups, options, product assignments, permissions.

DO $$ BEGIN
  CREATE TYPE "ModifierGroupStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ModifierOptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SelectionType" AS ENUM ('SINGLE', 'MULTIPLE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "menu_modifier_groups" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "selection_type" "SelectionType" NOT NULL DEFAULT 'SINGLE',
    "minimum_selection" INTEGER NOT NULL DEFAULT 0,
    "maximum_selection" INTEGER NOT NULL DEFAULT 1,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ModifierGroupStatus" NOT NULL DEFAULT 'INACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_modifier_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "menu_modifier_groups_business_id_name_key"
  ON "menu_modifier_groups"("business_id", "name");

CREATE INDEX IF NOT EXISTS "menu_modifier_groups_business_id_status_idx"
  ON "menu_modifier_groups"("business_id", "status");

CREATE INDEX IF NOT EXISTS "menu_modifier_groups_business_id_display_order_idx"
  ON "menu_modifier_groups"("business_id", "display_order");

DO $$ BEGIN
  ALTER TABLE "menu_modifier_groups" ADD CONSTRAINT "menu_modifier_groups_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "menu_modifier_options" (
    "id" TEXT NOT NULL,
    "modifier_group_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_adjustment" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cost_adjustment" DECIMAL(10,2),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ModifierOptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_modifier_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "menu_modifier_options_modifier_group_id_name_key"
  ON "menu_modifier_options"("modifier_group_id", "name");

CREATE INDEX IF NOT EXISTS "menu_modifier_options_modifier_group_id_display_order_idx"
  ON "menu_modifier_options"("modifier_group_id", "display_order");

DO $$ BEGIN
  ALTER TABLE "menu_modifier_options" ADD CONSTRAINT "menu_modifier_options_modifier_group_id_fkey"
    FOREIGN KEY ("modifier_group_id") REFERENCES "menu_modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "product_modifier_groups" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "modifier_group_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_modifier_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_modifier_groups_product_id_modifier_group_id_key"
  ON "product_modifier_groups"("product_id", "modifier_group_id");

CREATE INDEX IF NOT EXISTS "product_modifier_groups_product_id_display_order_idx"
  ON "product_modifier_groups"("product_id", "display_order");

DO $$ BEGIN
  ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "menu_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_modifier_group_id_fkey"
    FOREIGN KEY ("modifier_group_id") REFERENCES "menu_modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid()::text, 'modifier.view', 'View Modifiers', 'View modifier groups and options', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'modifier.create', 'Create Modifiers', 'Create modifier groups and options', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'modifier.update', 'Update Modifiers', 'Update modifier groups and options', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'modifier.delete', 'Delete Modifiers', 'Delete or archive modifier groups', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'modifier.assign', 'Assign Modifiers', 'Assign modifier groups to products', 'restaurant', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
