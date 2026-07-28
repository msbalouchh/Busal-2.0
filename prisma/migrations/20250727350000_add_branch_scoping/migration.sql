-- Branch permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'branch.view', 'View Branches', 'View branch list and dashboards', 'branch', NOW(), NOW()),
  (gen_random_uuid(), 'branch.manage', 'Manage Branches', 'Create, update, and delete branches', 'branch', NOW(), NOW()),
  (gen_random_uuid(), 'branch.access', 'Access Branches', 'Switch between and operate within branches', 'branch', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Add branch_id columns
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "tables" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "qr_codes" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "qr_menu_sessions" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "order_sessions" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "kitchen_queue" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "stock_adjustments" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;

-- Backfill existing records to main branch per business
UPDATE "categories" c SET "branch_id" = b.id FROM "branches" b WHERE c."business_id" = b."business_id" AND b."is_main" = true AND c."branch_id" IS NULL;
UPDATE "menu_items" m SET "branch_id" = b.id FROM "branches" b WHERE m."business_id" = b."business_id" AND b."is_main" = true AND m."branch_id" IS NULL;
UPDATE "tables" t SET "branch_id" = b.id FROM "branches" b WHERE t."business_id" = b."business_id" AND b."is_main" = true AND t."branch_id" IS NULL;
UPDATE "reservations" r SET "branch_id" = b.id FROM "branches" b WHERE r."business_id" = b."business_id" AND b."is_main" = true AND r."branch_id" IS NULL;
UPDATE "qr_codes" q SET "branch_id" = b.id FROM "branches" b WHERE q."business_id" = b."business_id" AND b."is_main" = true AND q."branch_id" IS NULL;
UPDATE "qr_menu_sessions" s SET "branch_id" = b.id FROM "branches" b WHERE s."business_id" = b."business_id" AND b."is_main" = true AND s."branch_id" IS NULL;
UPDATE "carts" c SET "branch_id" = b.id FROM "branches" b WHERE c."business_id" = b."business_id" AND b."is_main" = true AND c."branch_id" IS NULL;
UPDATE "order_sessions" o SET "branch_id" = b.id FROM "branches" b WHERE o."business_id" = b."business_id" AND b."is_main" = true AND o."branch_id" IS NULL;
UPDATE "orders" o SET "branch_id" = b.id FROM "branches" b WHERE o."business_id" = b."business_id" AND b."is_main" = true AND o."branch_id" IS NULL;
UPDATE "kitchen_queue" k SET "branch_id" = b.id FROM "branches" b WHERE k."business_id" = b."business_id" AND b."is_main" = true AND k."branch_id" IS NULL;
UPDATE "payments" p SET "branch_id" = b.id FROM "branches" b WHERE p."business_id" = b."business_id" AND b."is_main" = true AND p."branch_id" IS NULL;
UPDATE "receipts" r SET "branch_id" = b.id FROM "branches" b WHERE r."business_id" = b."business_id" AND b."is_main" = true AND r."branch_id" IS NULL;
UPDATE "stock_movements" s SET "branch_id" = b.id FROM "branches" b WHERE s."business_id" = b."business_id" AND b."is_main" = true AND s."branch_id" IS NULL;
UPDATE "stock_adjustments" s SET "branch_id" = b.id FROM "branches" b WHERE s."business_id" = b."business_id" AND b."is_main" = true AND s."branch_id" IS NULL;

-- Foreign keys
ALTER TABLE "categories" ADD CONSTRAINT "categories_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tables" ADD CONSTRAINT "tables_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qr_menu_sessions" ADD CONSTRAINT "qr_menu_sessions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "carts" ADD CONSTRAINT "carts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_sessions" ADD CONSTRAINT "order_sessions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "kitchen_queue" ADD CONSTRAINT "kitchen_queue_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "categories_business_id_branch_id_idx" ON "categories"("business_id", "branch_id");
CREATE INDEX IF NOT EXISTS "menu_items_business_id_branch_id_idx" ON "menu_items"("business_id", "branch_id");
CREATE INDEX IF NOT EXISTS "orders_business_id_branch_id_idx" ON "orders"("business_id", "branch_id");
CREATE INDEX IF NOT EXISTS "payments_business_id_branch_id_idx" ON "payments"("business_id", "branch_id");
CREATE INDEX IF NOT EXISTS "kitchen_queue_business_id_branch_id_idx" ON "kitchen_queue"("business_id", "branch_id");
CREATE INDEX IF NOT EXISTS "tables_business_id_branch_id_idx" ON "tables"("business_id", "branch_id");
