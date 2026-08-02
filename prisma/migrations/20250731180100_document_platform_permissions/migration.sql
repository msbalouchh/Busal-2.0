-- Document Platform permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'document.view', 'View Documents', 'View documents, folders, and templates', 'document', NOW(), NOW()),
    (gen_random_uuid(), 'document.create', 'Create Documents', 'Create documents, folders, and templates', 'document', NOW(), NOW()),
    (gen_random_uuid(), 'document.update', 'Update Documents', 'Update documents and folder structure', 'document', NOW(), NOW()),
    (gen_random_uuid(), 'document.delete', 'Delete Documents', 'Delete or archive documents', 'document', NOW(), NOW()),
    (gen_random_uuid(), 'document.export', 'Export Documents', 'Export documents in supported formats', 'document', NOW(), NOW()),
    (gen_random_uuid(), 'document.manage', 'Manage Documents', 'Manage document platform settings and sharing', 'document', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
