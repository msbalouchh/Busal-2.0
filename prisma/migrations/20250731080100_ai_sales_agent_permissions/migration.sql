-- AI Sales Agent permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'ai.sales.view', 'View AI Sales Agent', 'View sales insights, recommendations, and opportunities', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.sales.execute', 'Execute AI Sales Agent', 'Run sales analysis and generate recommendations', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.sales.manage', 'Manage AI Sales Agent', 'Manage sales insights and recommendation status', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
