-- Kitchen Display System: stations, product assignments, order kitchen timestamps, permissions.

DO $$ BEGIN
  CREATE TYPE "KitchenStationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "KitchenOrderStatus" AS ENUM ('NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "kitchen_stations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "KitchenStationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitchen_stations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "kitchen_stations_branch_id_name_key"
  ON "kitchen_stations"("branch_id", "name");

CREATE INDEX IF NOT EXISTS "kitchen_stations_business_id_branch_id_status_idx"
  ON "kitchen_stations"("business_id", "branch_id", "status");

CREATE INDEX IF NOT EXISTS "kitchen_stations_branch_id_display_order_idx"
  ON "kitchen_stations"("branch_id", "display_order");

DO $$ BEGIN
  ALTER TABLE "kitchen_stations" ADD CONSTRAINT "kitchen_stations_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "kitchen_stations" ADD CONSTRAINT "kitchen_stations_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "kitchen_station_products" (
    "id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kitchen_station_products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "kitchen_station_products_station_id_product_id_key"
  ON "kitchen_station_products"("station_id", "product_id");

CREATE INDEX IF NOT EXISTS "kitchen_station_products_product_id_idx"
  ON "kitchen_station_products"("product_id");

DO $$ BEGIN
  ALTER TABLE "kitchen_station_products" ADD CONSTRAINT "kitchen_station_products_station_id_fkey"
    FOREIGN KEY ("station_id") REFERENCES "kitchen_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "kitchen_station_products" ADD CONSTRAINT "kitchen_station_products_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "menu_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "restaurant_orders" ADD COLUMN IF NOT EXISTS "is_priority" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "restaurant_orders" ADD COLUMN IF NOT EXISTS "kitchen_accepted_at" TIMESTAMP(3);
ALTER TABLE "restaurant_orders" ADD COLUMN IF NOT EXISTS "kitchen_preparing_at" TIMESTAMP(3);
ALTER TABLE "restaurant_orders" ADD COLUMN IF NOT EXISTS "kitchen_ready_at" TIMESTAMP(3);
ALTER TABLE "restaurant_orders" ADD COLUMN IF NOT EXISTS "kitchen_served_at" TIMESTAMP(3);

ALTER TABLE "restaurant_order_items" ADD COLUMN IF NOT EXISTS "preparing_started_at" TIMESTAMP(3);
ALTER TABLE "restaurant_order_items" ADD COLUMN IF NOT EXISTS "ready_at" TIMESTAMP(3);

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid()::text, 'kitchen.assign_station', 'Assign Kitchen Station', 'Assign products to kitchen stations', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'kitchen.manage', 'Manage Kitchen', 'Create and manage kitchen stations', 'restaurant', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
