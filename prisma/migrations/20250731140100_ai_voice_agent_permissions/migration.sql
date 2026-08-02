-- AI Voice Agent permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'ai.voice.view', 'View AI Voice Agent', 'View voice sessions, commands, and analytics', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.voice.execute', 'Execute AI Voice Agent', 'Start voice sessions and process voice commands', 'ai', NOW(), NOW()),
    (gen_random_uuid(), 'ai.voice.manage', 'Manage AI Voice Agent', 'Manage voice sessions, settings, and command history', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
