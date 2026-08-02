-- App Marketplace Platform permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'marketplace.update', 'Update Marketplace Apps', 'Update and configure installed marketplace apps', 'marketplace', NOW(), NOW()),
    (gen_random_uuid(), 'marketplace.delete', 'Delete Marketplace Apps', 'Uninstall and remove marketplace apps', 'marketplace', NOW(), NOW()),
    (gen_random_uuid(), 'marketplace.manage', 'Manage Marketplace', 'Manage marketplace settings and app lifecycle', 'marketplace', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
