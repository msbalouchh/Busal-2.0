-- Reservation management: extend reservations for branch/table/customer integration.

DO $$ BEGIN
  ALTER TYPE "ReservationSource" ADD VALUE IF NOT EXISTS 'GOOGLE';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ReservationSource" ADD VALUE IF NOT EXISTS 'FACEBOOK';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ReservationSource" ADD VALUE IF NOT EXISTS 'INSTAGRAM';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ReservationSource" ADD VALUE IF NOT EXISTS 'OTHER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "reservations" RENAME COLUMN "customer_name" TO "guest_name";
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "reservations" RENAME COLUMN "customer_phone" TO "guest_phone";
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "reservations" RENAME COLUMN "customer_email" TO "guest_email";
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "restaurant_table_id" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "customer_id" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "assigned_staff_id" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "special_requests" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "check_in_time" TIMESTAMP(3);
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "check_out_time" TIMESTAMP(3);

UPDATE "reservations"
SET "branch_id" = (
  SELECT b."id"
  FROM "branches" b
  WHERE b."business_id" = "reservations"."business_id"
  ORDER BY b."is_main" DESC, b."created_at" ASC
  LIMIT 1
)
WHERE "branch_id" IS NULL;

ALTER TABLE "reservations" ALTER COLUMN "branch_id" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_restaurant_table_id_fkey"
    FOREIGN KEY ("restaurant_table_id") REFERENCES "restaurant_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_assigned_staff_id_fkey"
    FOREIGN KEY ("assigned_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "reservations_business_id_branch_id_reservation_date_status_idx"
  ON "reservations"("business_id", "branch_id", "reservation_date", "status");

CREATE INDEX IF NOT EXISTS "reservations_branch_id_reservation_date_restaurant_table_id_idx"
  ON "reservations"("branch_id", "reservation_date", "restaurant_table_id");

CREATE INDEX IF NOT EXISTS "reservations_business_id_guest_phone_idx"
  ON "reservations"("business_id", "guest_phone");

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid()::text, 'reservation.cancel', 'Cancel Reservations', 'Cancel restaurant reservations', 'reservation', NOW(), NOW()),
  (gen_random_uuid()::text, 'reservation.assign_table', 'Assign Reservation Tables', 'Assign tables to reservations', 'reservation', NOW(), NOW()),
  (gen_random_uuid()::text, 'reservation.assign_staff', 'Assign Reservation Staff', 'Assign staff to reservations', 'reservation', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
