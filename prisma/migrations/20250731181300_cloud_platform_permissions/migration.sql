-- Cloud Platform permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'cloud.view', 'View Cloud', 'View cloud dashboard, tenants, and usage analytics', 'cloud', NOW(), NOW()),
    (gen_random_uuid(), 'cloud.manage', 'Manage Cloud', 'Manage cloud platform settings and provisioning', 'cloud', NOW(), NOW()),
    (gen_random_uuid(), 'subscription.manage', 'Manage Subscriptions', 'Manage tenant subscriptions and trials', 'cloud', NOW(), NOW()),
    (gen_random_uuid(), 'tenant.manage', 'Manage Tenants', 'Provision and manage SaaS tenants', 'cloud', NOW(), NOW()),
    (gen_random_uuid(), 'plan.manage', 'Manage Plans', 'Manage subscription plans and pricing tiers', 'cloud', NOW(), NOW()),
    (gen_random_uuid(), 'license.manage', 'Manage Licenses', 'Manage and validate tenant licenses', 'cloud', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
