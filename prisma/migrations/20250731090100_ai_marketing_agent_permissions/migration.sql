-- AI Marketing Agent permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'ai.marketing.view', 'View AI Marketing Agent', 'View marketing insights, campaigns, and audience analytics', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.marketing.execute', 'Execute AI Marketing Agent', 'Run marketing analysis and generate recommendations', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.marketing.manage', 'Manage AI Marketing Agent', 'Manage marketing campaigns and insight status', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
