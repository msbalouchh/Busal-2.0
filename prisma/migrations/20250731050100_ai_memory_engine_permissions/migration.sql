-- AI Memory Engine permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'ai.memory.view', 'View AI Memory', 'View AI memory records and collections', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.memory.create', 'Create AI Memory', 'Create AI memory records and collections', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.memory.update', 'Update AI Memory', 'Update, pin, merge, and archive AI memory', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.memory.delete', 'Delete AI Memory', 'Delete AI memory records and collections', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
