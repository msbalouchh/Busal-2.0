-- AI Customer Support Agent permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'ai.support.view', 'View AI Support Agent', 'View support insights, recommendations, and ticket analytics', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.support.execute', 'Execute AI Support Agent', 'Run support analysis and generate response suggestions', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.support.manage', 'Manage AI Support Agent', 'Manage support insights and recommendation status', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
