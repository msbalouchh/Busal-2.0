-- RBAC foundation: business member role assignments + granular permissions

CREATE TABLE IF NOT EXISTS "business_member_roles" (
    "id" TEXT NOT NULL,
    "business_member_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_member_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "business_member_roles_business_member_id_role_id_key"
    ON "business_member_roles"("business_member_id", "role_id");
CREATE INDEX IF NOT EXISTS "business_member_roles_role_id_idx" ON "business_member_roles"("role_id");

ALTER TABLE "business_member_roles"
    ADD CONSTRAINT "business_member_roles_business_member_id_fkey"
    FOREIGN KEY ("business_member_id") REFERENCES "business_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "business_member_roles"
    ADD CONSTRAINT "business_member_roles_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'dashboard.view', 'View Dashboard', 'Access the business dashboard', 'dashboard', NOW(), NOW()),
    (gen_random_uuid(), 'order.update', 'Update Orders', 'Modify existing orders', 'order', NOW(), NOW()),
    (gen_random_uuid(), 'order.delete', 'Delete Orders', 'Remove orders from the system', 'order', NOW(), NOW()),
    (gen_random_uuid(), 'reservation.create', 'Create Reservations', 'Create new reservations', 'reservation', NOW(), NOW()),
    (gen_random_uuid(), 'reservation.update', 'Update Reservations', 'Modify existing reservations', 'reservation', NOW(), NOW()),
    (gen_random_uuid(), 'reservation.delete', 'Delete Reservations', 'Cancel or remove reservations', 'reservation', NOW(), NOW()),
    (gen_random_uuid(), 'customer.view', 'View Customers', 'View customer profiles', 'customer', NOW(), NOW()),
    (gen_random_uuid(), 'customer.create', 'Create Customers', 'Add new customers', 'customer', NOW(), NOW()),
    (gen_random_uuid(), 'customer.update', 'Update Customers', 'Edit customer profiles', 'customer', NOW(), NOW()),
    (gen_random_uuid(), 'customer.delete', 'Delete Customers', 'Remove customer records', 'customer', NOW(), NOW()),
    (gen_random_uuid(), 'roles.view', 'View Roles', 'View roles and permission assignments', 'roles', NOW(), NOW()),
    (gen_random_uuid(), 'roles.create', 'Create Roles', 'Create custom roles', 'roles', NOW(), NOW()),
    (gen_random_uuid(), 'roles.update', 'Update Roles', 'Edit roles and permissions', 'roles', NOW(), NOW()),
    (gen_random_uuid(), 'roles.delete', 'Delete Roles', 'Delete custom roles', 'roles', NOW(), NOW()),
    (gen_random_uuid(), 'roles.manage', 'Manage Roles', 'Full role and permission administration', 'roles', NOW(), NOW()),
    (gen_random_uuid(), 'ai.view', 'View AI', 'Access AI features and insights', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.use', 'Use AI', 'Execute AI assistants and automations', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'billing.view', 'View Billing', 'View billing and subscription details', 'billing', NOW(), NOW()),
    (gen_random_uuid(), 'billing.update', 'Update Billing', 'Manage billing settings and payment methods', 'billing', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
