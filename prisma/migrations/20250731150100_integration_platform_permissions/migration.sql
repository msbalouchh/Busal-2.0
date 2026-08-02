-- Integration Platform permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'integration.view', 'View Integrations', 'View integration providers, connections, and logs', 'integration', NOW(), NOW()),
    (gen_random_uuid(), 'integration.create', 'Create Integrations', 'Create integration connections and webhooks', 'integration', NOW(), NOW()),
    (gen_random_uuid(), 'integration.update', 'Update Integrations', 'Update integration connections and configuration', 'integration', NOW(), NOW()),
    (gen_random_uuid(), 'integration.delete', 'Delete Integrations', 'Delete integration connections and webhooks', 'integration', NOW(), NOW()),
    (gen_random_uuid(), 'integration.manage', 'Manage Integrations', 'Manage sync jobs, credentials, and integration health', 'integration', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
