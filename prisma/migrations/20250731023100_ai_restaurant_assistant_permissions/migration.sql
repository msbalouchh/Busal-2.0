-- AI Restaurant Assistant permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'ai.chat', 'AI Chat', 'Send messages to the restaurant AI assistant', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.recommendation.view', 'View AI Recommendations', 'View AI-generated restaurant recommendations', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.recommendation.manage', 'Manage AI Recommendations', 'Dismiss or implement AI recommendations', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
