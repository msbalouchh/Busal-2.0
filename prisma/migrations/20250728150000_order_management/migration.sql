-- Order management: restaurant orders/items/modifiers and permissions.

DO $$ BEGIN
  CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY', 'DELIVERY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RestaurantOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RestaurantOrderItemStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RestaurantOrderPaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "restaurant_orders" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "order_type" "OrderType" NOT NULL,
    "customer_id" TEXT,
    "restaurant_table_id" TEXT,
    "reservation_id" TEXT,
    "staff_id" TEXT,
    "status" "RestaurantOrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "service_charge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "delivery_charge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tip_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_status" "RestaurantOrderPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "payment_method" "PaymentMethod",
    "notes" TEXT,
    "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "merged_from_order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_orders_business_id_order_number_key"
  ON "restaurant_orders"("business_id", "order_number");

CREATE INDEX IF NOT EXISTS "restaurant_orders_business_id_branch_id_status_idx"
  ON "restaurant_orders"("business_id", "branch_id", "status");

CREATE INDEX IF NOT EXISTS "restaurant_orders_branch_id_placed_at_idx"
  ON "restaurant_orders"("branch_id", "placed_at");

CREATE INDEX IF NOT EXISTS "restaurant_orders_business_id_payment_status_idx"
  ON "restaurant_orders"("business_id", "payment_status");

CREATE TABLE IF NOT EXISTS "restaurant_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name_snapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "special_instructions" TEXT,
    "status" "RestaurantOrderItemStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_order_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "restaurant_order_items_order_id_status_idx"
  ON "restaurant_order_items"("order_id", "status");

CREATE TABLE IF NOT EXISTS "restaurant_order_item_modifiers" (
    "id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "modifier_option_id" TEXT NOT NULL,
    "name_snapshot" TEXT NOT NULL,
    "price_adjustment" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_order_item_modifiers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "restaurant_order_item_modifiers_order_item_id_idx"
  ON "restaurant_order_item_modifiers"("order_item_id");

DO $$ BEGIN
  ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_restaurant_table_id_fkey"
    FOREIGN KEY ("restaurant_table_id") REFERENCES "restaurant_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_reservation_id_fkey"
    FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_staff_id_fkey"
    FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_merged_from_order_id_fkey"
    FOREIGN KEY ("merged_from_order_id") REFERENCES "restaurant_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_order_items" ADD CONSTRAINT "restaurant_order_items_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "restaurant_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_order_items" ADD CONSTRAINT "restaurant_order_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "menu_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_order_item_modifiers" ADD CONSTRAINT "restaurant_order_item_modifiers_order_item_id_fkey"
    FOREIGN KEY ("order_item_id") REFERENCES "restaurant_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_order_item_modifiers" ADD CONSTRAINT "restaurant_order_item_modifiers_modifier_option_id_fkey"
    FOREIGN KEY ("modifier_option_id") REFERENCES "menu_modifier_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid()::text, 'order.discount', 'Apply Order Discounts', 'Apply discounts to restaurant orders', 'order', NOW(), NOW()),
  (gen_random_uuid()::text, 'order.transfer', 'Transfer Orders', 'Transfer table assignments for dine-in orders', 'order', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
