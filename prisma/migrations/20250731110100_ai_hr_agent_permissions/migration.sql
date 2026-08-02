-- AI HR Agent permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'ai.hr.view', 'View AI HR Agent', 'View HR insights, recommendations, and workforce analytics', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.hr.execute', 'Execute AI HR Agent', 'Run HR analysis and generate workforce recommendations', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.hr.manage', 'Manage AI HR Agent', 'Manage HR insights and recommendation status', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
