-- Link Supabase users to restaurant customer profiles for the customer portal.
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "user_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "customers_business_id_user_id_key"
  ON "customers"("business_id", "user_id")
  WHERE "user_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "customers_user_id_idx" ON "customers"("user_id");

ALTER TABLE "customers"
  ADD CONSTRAINT "customers_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
