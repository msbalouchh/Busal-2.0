-- AI Skills Library permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'ai.skill.view', 'View AI Skills', 'View AI skills library and execution history', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.skill.create', 'Create AI Skills', 'Register new AI skills', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.skill.update', 'Update AI Skills', 'Update, enable, and disable AI skills', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.skill.delete', 'Delete AI Skills', 'Delete or archive AI skills', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.skill.execute', 'Execute AI Skills', 'Execute AI skills from the library', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
