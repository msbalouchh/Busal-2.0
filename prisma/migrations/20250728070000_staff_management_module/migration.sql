-- Staff Management: extend Staff profile fields for production-ready staff records.

DO $$ BEGIN
  CREATE TYPE "StaffSalaryType" AS ENUM ('HOURLY', 'MONTHLY', 'SALARIED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "full_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "date_of_birth" TIMESTAMP(3);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "hire_date" TIMESTAMP(3);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "termination_date" TIMESTAMP(3);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "salary_type" "StaffSalaryType";
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "hourly_rate" DECIMAL(10,2);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "monthly_salary" DECIMAL(12,2);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "emergency_contact" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "notes" TEXT;

UPDATE "staff"
SET "full_name" = TRIM("first_name" || ' ' || "last_name")
WHERE "full_name" = '' OR "full_name" IS NULL;

UPDATE "staff"
SET "emergency_contact" = COALESCE("staff_profile"->'emergencyContact', '{}'::jsonb)
WHERE "emergency_contact" = '{}'::jsonb
  AND "staff_profile" ? 'emergencyContact';

UPDATE "staff"
SET "notes" = "staff_profile"->>'notes'
WHERE "notes" IS NULL
  AND "staff_profile" ? 'notes'
  AND "staff_profile"->>'notes' IS NOT NULL;

UPDATE "staff"
SET "avatar" = "staff_profile"->>'avatarUrl'
WHERE "avatar" IS NULL
  AND "staff_profile" ? 'avatarUrl'
  AND "staff_profile"->>'avatarUrl' IS NOT NULL;

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'staff.assign_role', 'Assign Staff Roles', 'Assign or change roles for staff members', 'staff', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'staff.assign_branch', 'Assign Staff Branches', 'Assign staff members to branches', 'staff', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
