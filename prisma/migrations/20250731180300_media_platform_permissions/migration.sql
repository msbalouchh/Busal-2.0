-- Media Platform permissions

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'media.view', 'View Media', 'View media library, folders, and files', 'media', NOW(), NOW()),
    (gen_random_uuid(), 'media.upload', 'Upload Media', 'Upload files to the media library', 'media', NOW(), NOW()),
    (gen_random_uuid(), 'media.update', 'Update Media', 'Update files, folders, tags, and metadata', 'media', NOW(), NOW()),
    (gen_random_uuid(), 'media.delete', 'Delete Media', 'Move files to recycle bin or permanently delete', 'media', NOW(), NOW()),
    (gen_random_uuid(), 'media.download', 'Download Media', 'Download files from the media library', 'media', NOW(), NOW()),
    (gen_random_uuid(), 'media.manage', 'Manage Media', 'Manage media platform settings, quotas, and sharing', 'media', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
