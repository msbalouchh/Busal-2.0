-- AI Orchestrator permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'ai.workflow.view', 'View AI Workflows', 'View AI orchestrator workflows and execution history', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.workflow.create', 'Create AI Workflows', 'Create AI orchestrator workflows', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.workflow.update', 'Update AI Workflows', 'Update, pause, and resume AI workflows', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.workflow.delete', 'Delete AI Workflows', 'Delete or archive AI workflows', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.workflow.execute', 'Execute AI Workflows', 'Run AI orchestrator workflows', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
