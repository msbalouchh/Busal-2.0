-- Branch management platform foundation

CREATE TYPE "BranchType" AS ENUM (
    'RESTAURANT',
    'SALON',
    'CLINIC',
    'RETAIL',
    'WAREHOUSE',
    'OFFICE',
    'HOTEL',
    'GYM',
    'PHARMACY',
    'SERVICE_AREA',
    'OTHER'
);

CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

ALTER TABLE "branches"
    ADD COLUMN IF NOT EXISTS "code" TEXT,
    ADD COLUMN IF NOT EXISTS "type" "BranchType" NOT NULL DEFAULT 'OTHER',
    ADD COLUMN IF NOT EXISTS "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS "email" TEXT,
    ADD COLUMN IF NOT EXISTS "website" TEXT,
    ADD COLUMN IF NOT EXISTS "address_line1" TEXT,
    ADD COLUMN IF NOT EXISTS "address_line2" TEXT,
    ADD COLUMN IF NOT EXISTS "county" TEXT,
    ADD COLUMN IF NOT EXISTS "postcode" TEXT,
    ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10, 7),
    ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(10, 7),
    ADD COLUMN IF NOT EXISTS "timezone" TEXT,
    ADD COLUMN IF NOT EXISTS "currency" TEXT,
    ADD COLUMN IF NOT EXISTS "tax_number" TEXT,
    ADD COLUMN IF NOT EXISTS "opening_hours" JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS "logo" TEXT,
    ADD COLUMN IF NOT EXISTS "cover_image" TEXT;

UPDATE "branches"
SET "address_line1" = "address"
WHERE "address_line1" IS NULL AND "address" IS NOT NULL;

UPDATE "branches"
SET "code" = CONCAT('BR-', UPPER(SUBSTRING(REPLACE("id", '-', ''), 1, 8)))
WHERE "code" IS NULL;

UPDATE "branches"
SET "status" = CASE WHEN "is_active" = false THEN 'ARCHIVED'::"BranchStatus" ELSE 'ACTIVE'::"BranchStatus" END;

CREATE UNIQUE INDEX IF NOT EXISTS "branches_business_id_code_key" ON "branches"("business_id", "code");
CREATE INDEX IF NOT EXISTS "branches_business_id_status_idx" ON "branches"("business_id", "status");

CREATE TABLE IF NOT EXISTS "branch_settings" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "branch_settings_branch_id_key" ON "branch_settings"("branch_id");

ALTER TABLE "branch_settings"
    ADD CONSTRAINT "branch_settings_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'branch.create', 'Create Branches', 'Create new business branches', 'branch', NOW(), NOW()),
    (gen_random_uuid(), 'branch.update', 'Update Branches', 'Edit branch details', 'branch', NOW(), NOW()),
    (gen_random_uuid(), 'branch.delete', 'Delete Branches', 'Archive or remove branches', 'branch', NOW(), NOW()),
    (gen_random_uuid(), 'branch.settings', 'Manage Branch Settings', 'Configure branch-level settings', 'branch', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
