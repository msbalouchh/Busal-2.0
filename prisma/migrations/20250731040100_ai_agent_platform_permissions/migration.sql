-- AI Agent Platform permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'ai.agent.update', 'Update AI Agents', 'Update AI agent configuration', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.agent.delete', 'Delete AI Agents', 'Delete or archive AI agents', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.agent.execute', 'Execute AI Agents', 'Run AI agent executions', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
