-- Payment engine: payments table and enums
-- Idempotent re-run safe for partially applied databases.

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('COMPLETED', 'VOIDED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "amount_tendered" DECIMAL(10,2),
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "payments_business_id_order_id_idx" ON "payments"("business_id", "order_id");
