-- Customer CRM & Loyalty permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'customer.import', 'Import Customers', 'Bulk import customer records', 'customer', NOW(), NOW()),
    (gen_random_uuid(), 'customer.export', 'Export Customers', 'Export customer records', 'customer', NOW(), NOW()),
    (gen_random_uuid(), 'loyalty.view', 'View Loyalty', 'View loyalty accounts and points history', 'loyalty', NOW(), NOW()),
    (gen_random_uuid(), 'loyalty.manage', 'Manage Loyalty', 'Earn, redeem, and adjust loyalty points', 'loyalty', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
