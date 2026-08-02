-- Automation Platform permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'automation.view', 'View Automation', 'View automation workflows and execution history', 'automation', NOW(), NOW()),
    (gen_random_uuid(), 'automation.create', 'Create Automation', 'Create automation workflows, triggers, and actions', 'automation', NOW(), NOW()),
    (gen_random_uuid(), 'automation.update', 'Update Automation', 'Update automation workflows and configuration', 'automation', NOW(), NOW()),
    (gen_random_uuid(), 'automation.delete', 'Delete Automation', 'Delete automation workflows', 'automation', NOW(), NOW()),
    (gen_random_uuid(), 'automation.execute', 'Execute Automation', 'Run, pause, resume, and retry automation workflows', 'automation', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
