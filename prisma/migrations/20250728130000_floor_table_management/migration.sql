-- Table & floor management: restaurant floors/tables and permissions.

DO $$ BEGIN
  CREATE TYPE "FloorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RestaurantTableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'DIRTY', 'OUT_OF_SERVICE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TableShape" AS ENUM ('SQUARE', 'RECTANGLE', 'ROUND', 'OVAL', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "restaurant_floors" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "FloorStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_floors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_floors_branch_id_name_key"
  ON "restaurant_floors"("branch_id", "name");

CREATE INDEX IF NOT EXISTS "restaurant_floors_business_id_branch_id_status_idx"
  ON "restaurant_floors"("business_id", "branch_id", "status");

CREATE INDEX IF NOT EXISTS "restaurant_floors_branch_id_display_order_idx"
  ON "restaurant_floors"("branch_id", "display_order");

DO $$ BEGIN
  ALTER TABLE "restaurant_floors" ADD CONSTRAINT "restaurant_floors_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_floors" ADD CONSTRAINT "restaurant_floors_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "restaurant_tables" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "floor_id" TEXT NOT NULL,
    "table_number" TEXT NOT NULL,
    "table_name" TEXT,
    "capacity" INTEGER NOT NULL,
    "minimum_capacity" INTEGER NOT NULL DEFAULT 1,
    "shape" "TableShape" NOT NULL DEFAULT 'SQUARE',
    "position_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position_y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "RestaurantTableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "is_reservable" BOOLEAN NOT NULL DEFAULT true,
    "is_mergeable" BOOLEAN NOT NULL DEFAULT true,
    "merged_into_table_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_tables_branch_id_table_number_key"
  ON "restaurant_tables"("branch_id", "table_number");

CREATE INDEX IF NOT EXISTS "restaurant_tables_business_id_branch_id_status_idx"
  ON "restaurant_tables"("business_id", "branch_id", "status");

CREATE INDEX IF NOT EXISTS "restaurant_tables_floor_id_status_idx"
  ON "restaurant_tables"("floor_id", "status");

DO $$ BEGIN
  ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_floor_id_fkey"
    FOREIGN KEY ("floor_id") REFERENCES "restaurant_floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_merged_into_table_id_fkey"
    FOREIGN KEY ("merged_into_table_id") REFERENCES "restaurant_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid()::text, 'floor.view', 'View Floors', 'View restaurant floors and floor plans', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'floor.create', 'Create Floors', 'Create restaurant floors', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'floor.update', 'Update Floors', 'Update restaurant floors', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'floor.delete', 'Delete Floors', 'Archive or delete restaurant floors', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'table.view', 'View Tables', 'View restaurant tables', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'table.create', 'Create Tables', 'Create restaurant tables', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'table.update', 'Update Tables', 'Update restaurant tables and layout', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'table.delete', 'Delete Tables', 'Archive or delete restaurant tables', 'restaurant', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
