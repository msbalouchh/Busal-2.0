-- Restaurant Analytics permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'analytics.export', 'Export Analytics', 'Export reports as CSV, Excel, or PDF', 'analytics', NOW(), NOW()),
    (gen_random_uuid(), 'analytics.create_report', 'Create Reports', 'Create saved custom reports', 'analytics', NOW(), NOW()),
    (gen_random_uuid(), 'analytics.edit_report', 'Edit Reports', 'Edit saved reports', 'analytics', NOW(), NOW()),
    (gen_random_uuid(), 'analytics.delete_report', 'Delete Reports', 'Delete saved reports', 'analytics', NOW(), NOW()),
    (gen_random_uuid(), 'dashboard.manage', 'Manage Dashboard', 'Configure analytics dashboard widgets', 'dashboard', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
