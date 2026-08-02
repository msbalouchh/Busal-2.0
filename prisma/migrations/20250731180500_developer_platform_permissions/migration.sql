-- Developer Platform permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'developer.view', 'View Developer Platform', 'View API applications, keys, and logs', 'developer', NOW(), NOW()),
    (gen_random_uuid(), 'developer.create', 'Create Developer Resources', 'Create API applications, keys, and webhooks', 'developer', NOW(), NOW()),
    (gen_random_uuid(), 'developer.update', 'Update Developer Resources', 'Update API applications, keys, and webhooks', 'developer', NOW(), NOW()),
    (gen_random_uuid(), 'developer.delete', 'Delete Developer Resources', 'Revoke keys and delete developer resources', 'developer', NOW(), NOW()),
    (gen_random_uuid(), 'developer.manage', 'Manage Developer Platform', 'Manage developer settings, rate limits, and IP allow lists', 'developer', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
