-- Inventory & Supplier granular permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'inventory.create', 'Create Inventory', 'Create inventory items', 'inventory', NOW(), NOW()),
    (gen_random_uuid(), 'inventory.update', 'Update Inventory', 'Edit inventory items', 'inventory', NOW(), NOW()),
    (gen_random_uuid(), 'inventory.delete', 'Delete Inventory', 'Archive inventory items', 'inventory', NOW(), NOW()),
    (gen_random_uuid(), 'inventory.adjust', 'Adjust Inventory', 'Adjust and transfer stock levels', 'inventory', NOW(), NOW()),
    (gen_random_uuid(), 'supplier.view', 'View Suppliers', 'View supplier records', 'supplier', NOW(), NOW()),
    (gen_random_uuid(), 'supplier.create', 'Create Suppliers', 'Create supplier records', 'supplier', NOW(), NOW()),
    (gen_random_uuid(), 'supplier.update', 'Update Suppliers', 'Edit supplier records', 'supplier', NOW(), NOW()),
    (gen_random_uuid(), 'purchase_order.view', 'View Purchase Orders', 'View purchase orders', 'purchase_order', NOW(), NOW()),
    (gen_random_uuid(), 'purchase_order.create', 'Create Purchase Orders', 'Create and send purchase orders', 'purchase_order', NOW(), NOW()),
    (gen_random_uuid(), 'purchase_order.receive', 'Receive Purchase Orders', 'Receive stock from purchase orders', 'purchase_order', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
