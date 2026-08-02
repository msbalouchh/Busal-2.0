-- Enterprise Platform permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'enterprise.view', 'View Enterprise', 'View enterprise dashboard, organizations, and compliance', 'enterprise', NOW(), NOW()),
    (gen_random_uuid(), 'enterprise.manage', 'Manage Enterprise', 'Manage enterprise platform settings and configuration', 'enterprise', NOW(), NOW()),
    (gen_random_uuid(), 'organization.manage', 'Manage Organizations', 'Create and manage enterprise organizations and units', 'enterprise', NOW(), NOW()),
    (gen_random_uuid(), 'identity.manage', 'Manage Identity Providers', 'Configure enterprise identity providers and SSO frameworks', 'enterprise', NOW(), NOW()),
    (gen_random_uuid(), 'policy.manage', 'Manage Policies', 'Create and enforce enterprise security and compliance policies', 'enterprise', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
