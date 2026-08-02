-- Restaurant module foundation: settings, branding, and permissions.

CREATE TABLE IF NOT EXISTS "restaurant_settings" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "default_branch_id" TEXT,
    "business_registration_number" TEXT,
    "food_license_number" TEXT,
    "vat_number" TEXT,
    "default_currency" TEXT DEFAULT 'GBP',
    "default_tax_rate" DECIMAL(5,2),
    "service_charge_enabled" BOOLEAN NOT NULL DEFAULT false,
    "service_charge_percentage" DECIMAL(5,2),
    "allow_takeaway" BOOLEAN NOT NULL DEFAULT true,
    "allow_delivery" BOOLEAN NOT NULL DEFAULT false,
    "allow_dine_in" BOOLEAN NOT NULL DEFAULT true,
    "allow_reservations" BOOLEAN NOT NULL DEFAULT true,
    "reservation_interval_minutes" INTEGER NOT NULL DEFAULT 30,
    "reservation_buffer_minutes" INTEGER NOT NULL DEFAULT 15,
    "kitchen_display_enabled" BOOLEAN NOT NULL DEFAULT false,
    "qr_ordering_enabled" BOOLEAN NOT NULL DEFAULT false,
    "pos_enabled" BOOLEAN NOT NULL DEFAULT false,
    "loyalty_enabled" BOOLEAN NOT NULL DEFAULT false,
    "online_ordering_enabled" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "restaurant_branding" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "logo" TEXT,
    "cover_image" TEXT,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "receipt_footer" TEXT,
    "website" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_branding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_settings_business_id_key" ON "restaurant_settings"("business_id");
CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_branding_business_id_key" ON "restaurant_branding"("business_id");

DO $$ BEGIN
  ALTER TABLE "restaurant_settings" ADD CONSTRAINT "restaurant_settings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_settings" ADD CONSTRAINT "restaurant_settings_default_branch_id_fkey" FOREIGN KEY ("default_branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "restaurant_branding" ADD CONSTRAINT "restaurant_branding_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'restaurant.view', 'View Restaurant', 'View restaurant module dashboard and configuration', 'restaurant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'restaurant.update', 'Update Restaurant', 'Update restaurant module settings and feature toggles', 'restaurant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'restaurant.branding', 'Manage Restaurant Branding', 'Manage restaurant branding and guest-facing identity', 'restaurant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'restaurant.settings', 'Manage Restaurant Settings', 'Manage restaurant compliance and operational settings', 'restaurant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
