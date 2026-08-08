-- Platform Orchestration permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'orchestration.read', 'Read Orchestration', 'View domain event registry, metrics, and event history', 'orchestration', NOW(), NOW()),
    (gen_random_uuid(), 'orchestration.publish', 'Publish Orchestration Events', 'Publish domain events through the platform event bus', 'orchestration', NOW(), NOW()),
    (gen_random_uuid(), 'orchestration.admin', 'Administer Orchestration', 'Manage orchestration configuration and replay events', 'orchestration', NOW(), NOW()),
    (gen_random_uuid(), 'orchestration.queue', 'Process Orchestration Queue', 'Process background orchestration jobs and dead letter queue', 'orchestration', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
