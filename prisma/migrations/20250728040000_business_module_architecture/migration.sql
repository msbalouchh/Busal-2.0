-- Business module architecture foundation

CREATE TYPE "BusinessModuleStatus" AS ENUM ('AVAILABLE', 'INSTALLED', 'ENABLED', 'DISABLED', 'DEPRECATED');

CREATE TABLE IF NOT EXISTS "business_modules" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "status" "BusinessModuleStatus" NOT NULL DEFAULT 'INSTALLED',
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "installed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_modules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "business_modules_business_id_module_key_key"
    ON "business_modules"("business_id", "module_key");
CREATE INDEX IF NOT EXISTS "business_modules_business_id_is_enabled_idx"
    ON "business_modules"("business_id", "is_enabled");

ALTER TABLE "business_modules"
    ADD CONSTRAINT "business_modules_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "module_configurations" (
    "id" TEXT NOT NULL,
    "business_module_id" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_configurations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "module_configurations_business_module_id_key"
    ON "module_configurations"("business_module_id");

ALTER TABLE "module_configurations"
    ADD CONSTRAINT "module_configurations_business_module_id_fkey"
    FOREIGN KEY ("business_module_id") REFERENCES "business_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'modules.view', 'View Modules', 'View installed and available business modules', 'modules', NOW(), NOW()),
    (gen_random_uuid(), 'modules.install', 'Install Modules', 'Install industry modules for the business', 'modules', NOW(), NOW()),
    (gen_random_uuid(), 'modules.enable', 'Enable Modules', 'Enable installed modules', 'modules', NOW(), NOW()),
    (gen_random_uuid(), 'modules.disable', 'Disable Modules', 'Disable active modules', 'modules', NOW(), NOW()),
    (gen_random_uuid(), 'modules.manage', 'Manage Modules', 'Full module administration', 'modules', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
