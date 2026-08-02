-- Communication Platform permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'communication.create', 'Create Communication', 'Create communication channels, templates, and campaigns', 'communication', NOW(), NOW()),
    (gen_random_uuid(), 'communication.send', 'Send Communication', 'Send messages and execute communication campaigns', 'communication', NOW(), NOW()),
    (gen_random_uuid(), 'communication.delete', 'Delete Communication', 'Delete communication channels, templates, and campaigns', 'communication', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
