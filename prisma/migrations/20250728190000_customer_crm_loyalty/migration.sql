-- Customer CRM & Loyalty extensions

ALTER TYPE "CustomerStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';
ALTER TYPE "CustomerStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

CREATE TYPE "LoyaltyTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'VIP');
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARN', 'REDEEM', 'ADJUSTMENT', 'EXPIRE');

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "customer_code" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "first_name" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "last_name" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "full_name" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "profile_image" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "preferred_language" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "marketing_consent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "total_orders" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "total_spend" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "average_order_value" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "last_order_at" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "last_visit_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "customers_business_id_customer_code_key" ON "customers"("business_id", "customer_code");
CREATE INDEX IF NOT EXISTS "customers_business_id_status_idx" ON "customers"("business_id", "status");
CREATE INDEX IF NOT EXISTS "customers_business_id_last_order_at_idx" ON "customers"("business_id", "last_order_at");

CREATE TABLE IF NOT EXISTS "customer_addresses" (
  "id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "label" TEXT,
  "address_line1" TEXT NOT NULL,
  "address_line2" TEXT,
  "city" TEXT,
  "postcode" TEXT,
  "country" TEXT,
  "latitude" DECIMAL(10,7),
  "longitude" DECIMAL(10,7),
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "loyalty_accounts" (
  "id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "membership_number" TEXT NOT NULL,
  "tier" "LoyaltyTier" NOT NULL DEFAULT 'BRONZE',
  "points_balance" INTEGER NOT NULL DEFAULT 0,
  "lifetime_points" INTEGER NOT NULL DEFAULT 0,
  "total_redeemed_points" INTEGER NOT NULL DEFAULT 0,
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "loyalty_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "loyalty_transactions" (
  "id" TEXT NOT NULL,
  "loyalty_account_id" TEXT NOT NULL,
  "type" "LoyaltyTransactionType" NOT NULL,
  "points" INTEGER NOT NULL,
  "reference" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "loyalty_accounts_customer_id_key" ON "loyalty_accounts"("customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "loyalty_accounts_membership_number_key" ON "loyalty_accounts"("membership_number");
CREATE INDEX IF NOT EXISTS "customer_addresses_customer_id_is_default_idx" ON "customer_addresses"("customer_id", "is_default");
CREATE INDEX IF NOT EXISTS "loyalty_transactions_loyalty_account_id_created_at_idx" ON "loyalty_transactions"("loyalty_account_id", "created_at");

ALTER TABLE "customer_addresses" DROP CONSTRAINT IF EXISTS "customer_addresses_customer_id_fkey";
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loyalty_accounts" DROP CONSTRAINT IF EXISTS "loyalty_accounts_customer_id_fkey";
ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loyalty_transactions" DROP CONSTRAINT IF EXISTS "loyalty_transactions_loyalty_account_id_fkey";
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_loyalty_account_id_fkey" FOREIGN KEY ("loyalty_account_id") REFERENCES "loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
