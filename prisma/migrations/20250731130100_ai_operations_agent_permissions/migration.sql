-- AI Operations Agent permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'ai.operations.view', 'View AI Operations Agent', 'View operational insights, recommendations, and analytics', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.operations.execute', 'Execute AI Operations Agent', 'Run operational analysis and generate efficiency recommendations', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.operations.manage', 'Manage AI Operations Agent', 'Manage operational insights and recommendation status', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
