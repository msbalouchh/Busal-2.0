-- AI Finance Agent permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'ai.finance.view', 'View AI Finance Agent', 'View financial insights, recommendations, and analytics', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.finance.execute', 'Execute AI Finance Agent', 'Run financial analysis and generate recommendations', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.finance.manage', 'Manage AI Finance Agent', 'Manage financial insights and recommendation status', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
