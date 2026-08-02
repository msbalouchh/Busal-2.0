-- Inventory & Supplier Management

ALTER TYPE "SupplierStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

CREATE TYPE "InventoryStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');
CREATE TYPE "InventoryTransactionType" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'TRANSFER', 'WASTE', 'RETURN');

ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "country" TEXT;

CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "branch_id" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "barcode" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "unit" TEXT NOT NULL DEFAULT 'each',
  "current_stock" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "minimum_stock" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "maximum_stock" DECIMAL(12,4),
  "reorder_level" DECIMAL(12,4),
  "average_cost" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "status" "InventoryStatus" NOT NULL DEFAULT 'ACTIVE',
  "track_stock" BOOLEAN NOT NULL DEFAULT true,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "purchase_orders" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "branch_id" TEXT NOT NULL,
  "supplier_id" TEXT NOT NULL,
  "purchase_order_number" TEXT NOT NULL,
  "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "expected_delivery_date" DATE,
  "received_date" DATE,
  "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "purchase_order_items" (
  "id" TEXT NOT NULL,
  "purchase_order_id" TEXT NOT NULL,
  "inventory_item_id" TEXT NOT NULL,
  "quantity" DECIMAL(12,4) NOT NULL,
  "unit_cost" DECIMAL(12,4) NOT NULL,
  "total_cost" DECIMAL(12,2) NOT NULL,
  "received_quantity" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "inventory_transactions" (
  "id" TEXT NOT NULL,
  "inventory_item_id" TEXT NOT NULL,
  "transaction_type" "InventoryTransactionType" NOT NULL,
  "quantity" DECIMAL(12,4) NOT NULL,
  "reference_type" TEXT,
  "reference_id" TEXT,
  "notes" TEXT,
  "performed_by_staff_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "inventory_items_business_id_branch_id_sku_key"
  ON "inventory_items"("business_id", "branch_id", "sku");
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_items_business_id_barcode_key"
  ON "inventory_items"("business_id", "barcode");
CREATE INDEX IF NOT EXISTS "inventory_items_business_id_branch_id_status_idx"
  ON "inventory_items"("business_id", "branch_id", "status");
CREATE INDEX IF NOT EXISTS "inventory_items_business_id_branch_id_current_stock_idx"
  ON "inventory_items"("business_id", "branch_id", "current_stock");

CREATE UNIQUE INDEX IF NOT EXISTS "purchase_orders_business_id_purchase_order_number_key"
  ON "purchase_orders"("business_id", "purchase_order_number");
CREATE INDEX IF NOT EXISTS "purchase_orders_business_id_branch_id_status_idx"
  ON "purchase_orders"("business_id", "branch_id", "status");

CREATE INDEX IF NOT EXISTS "purchase_order_items_purchase_order_id_idx" ON "purchase_order_items"("purchase_order_id");
CREATE INDEX IF NOT EXISTS "purchase_order_items_inventory_item_id_idx" ON "purchase_order_items"("inventory_item_id");
CREATE INDEX IF NOT EXISTS "inventory_transactions_inventory_item_id_created_at_idx"
  ON "inventory_transactions"("inventory_item_id", "created_at");
CREATE INDEX IF NOT EXISTS "inventory_transactions_reference_type_reference_id_idx"
  ON "inventory_transactions"("reference_type", "reference_id");

ALTER TABLE "inventory_items" DROP CONSTRAINT IF EXISTS "inventory_items_business_id_fkey";
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items" DROP CONSTRAINT IF EXISTS "inventory_items_branch_id_fkey";
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchase_orders" DROP CONSTRAINT IF EXISTS "purchase_orders_business_id_fkey";
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" DROP CONSTRAINT IF EXISTS "purchase_orders_branch_id_fkey";
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" DROP CONSTRAINT IF EXISTS "purchase_orders_supplier_id_fkey";
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey"
  FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "purchase_order_items" DROP CONSTRAINT IF EXISTS "purchase_order_items_purchase_order_id_fkey";
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey"
  FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_order_items" DROP CONSTRAINT IF EXISTS "purchase_order_items_inventory_item_id_fkey";
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_inventory_item_id_fkey"
  FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventory_transactions" DROP CONSTRAINT IF EXISTS "inventory_transactions_inventory_item_id_fkey";
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventory_item_id_fkey"
  FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_transactions" DROP CONSTRAINT IF EXISTS "inventory_transactions_performed_by_staff_id_fkey";
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_performed_by_staff_id_fkey"
  FOREIGN KEY ("performed_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
