-- Menu management module: menus, branch assignments, enums, and permissions.

DO $$ BEGIN
  CREATE TYPE "MenuType" AS ENUM (
    'BREAKFAST',
    'LUNCH',
    'DINNER',
    'ALL_DAY',
    'DRINKS',
    'DESSERT',
    'SPECIAL',
    'SEASONAL',
    'CUSTOM'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MenuStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "menus" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "menu_type" "MenuType" NOT NULL DEFAULT 'ALL_DAY',
    "status" "MenuStatus" NOT NULL DEFAULT 'DRAFT',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "available_from" TEXT,
    "available_until" TEXT,
    "days_available" JSONB NOT NULL DEFAULT '[1,2,3,4,5,6,7]',
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "menu_assignments" (
    "id" TEXT NOT NULL,
    "menu_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "menus_business_id_branch_id_name_key"
  ON "menus"("business_id", "branch_id", "name");

CREATE INDEX IF NOT EXISTS "menus_business_id_status_idx" ON "menus"("business_id", "status");
CREATE INDEX IF NOT EXISTS "menus_business_id_menu_type_idx" ON "menus"("business_id", "menu_type");

CREATE UNIQUE INDEX IF NOT EXISTS "menu_assignments_menu_id_branch_id_key"
  ON "menu_assignments"("menu_id", "branch_id");

DO $$ BEGIN
  ALTER TABLE "menus" ADD CONSTRAINT "menus_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "menus" ADD CONSTRAINT "menus_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "menu_assignments" ADD CONSTRAINT "menu_assignments_menu_id_fkey"
    FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "menu_assignments" ADD CONSTRAINT "menu_assignments_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'menu.publish', 'Publish Menu', 'Publish menus and set them active for service', 'menu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
