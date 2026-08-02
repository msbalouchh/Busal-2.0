-- Observability Platform permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'observability.view', 'View Observability', 'View observability dashboards, metrics, and health status', 'observability', NOW(), NOW()),
    (gen_random_uuid(), 'observability.manage', 'Manage Observability', 'Manage observability platform settings and telemetry', 'observability', NOW(), NOW()),
    (gen_random_uuid(), 'incident.manage', 'Manage Incidents', 'Create, assign, and resolve platform incidents', 'observability', NOW(), NOW()),
    (gen_random_uuid(), 'logs.view', 'View Logs', 'View and search platform logs and traces', 'observability', NOW(), NOW()),
    (gen_random_uuid(), 'alerts.manage', 'Manage Alerts', 'Acknowledge and resolve platform alerts', 'observability', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
