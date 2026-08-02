-- QR Ordering: table QR codes, sessions, order linkage, permissions.

DO $$ BEGIN
  CREATE TYPE "QRCodeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "QRSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "table_qr_codes" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "qr_code_url" TEXT NOT NULL,
    "status" "QRCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_qr_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "table_qr_codes_token_key" ON "table_qr_codes"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "table_qr_codes_table_id_key" ON "table_qr_codes"("table_id");
CREATE INDEX IF NOT EXISTS "table_qr_codes_business_id_branch_id_status_idx"
  ON "table_qr_codes"("business_id", "branch_id", "status");

DO $$ BEGIN
  ALTER TABLE "table_qr_codes" ADD CONSTRAINT "table_qr_codes_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "table_qr_codes" ADD CONSTRAINT "table_qr_codes_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "table_qr_codes" ADD CONSTRAINT "table_qr_codes_table_id_fkey"
    FOREIGN KEY ("table_id") REFERENCES "restaurant_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "qr_sessions" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "session_status" "QRSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "waiter_requested_at" TIMESTAMP(3),
    "bill_requested_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "qr_sessions_token_key" ON "qr_sessions"("token");
CREATE INDEX IF NOT EXISTS "qr_sessions_business_id_branch_id_session_status_idx"
  ON "qr_sessions"("business_id", "branch_id", "session_status");
CREATE INDEX IF NOT EXISTS "qr_sessions_expires_at_idx" ON "qr_sessions"("expires_at");

DO $$ BEGIN
  ALTER TABLE "qr_sessions" ADD CONSTRAINT "qr_sessions_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "qr_sessions" ADD CONSTRAINT "qr_sessions_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "qr_sessions" ADD CONSTRAINT "qr_sessions_table_id_fkey"
    FOREIGN KEY ("table_id") REFERENCES "restaurant_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "restaurant_orders" ADD COLUMN IF NOT EXISTS "qr_session_id" TEXT;

DO $$ BEGIN
  ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_qr_session_id_fkey"
    FOREIGN KEY ("qr_session_id") REFERENCES "qr_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "restaurant_orders_qr_session_id_idx" ON "restaurant_orders"("qr_session_id");

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid()::text, 'qr.view', 'View QR Ordering', 'View QR codes and sessions', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'qr.create', 'Create QR Ordering', 'Create QR ordering resources', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'qr.update', 'Update QR Ordering', 'Update QR codes and sessions', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'qr.delete', 'Delete QR Ordering', 'Archive or delete QR codes', 'restaurant', NOW(), NOW()),
  (gen_random_uuid()::text, 'qr.generate', 'Generate QR Codes', 'Generate and regenerate table QR codes', 'restaurant', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
