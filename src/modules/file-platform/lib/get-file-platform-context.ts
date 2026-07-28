import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeFileAuditLog,
  serializeFilePlatformDashboard,
  serializePlatformFile,
  serializePlatformFileVersion,
  serializePlatformFolder,
  serializeRetentionPolicy,
  serializeShareLink,
} from "@/modules/file-platform/utils/file-platform-utils";
import {
  ensureFilePlatformDefaults,
  getFilePlatformDashboard,
  listPlatformFileAuditLogs,
  listPlatformFilePermissions,
  listPlatformFiles,
  listPlatformFileVersions,
  listPlatformFolders,
  listPlatformShareLinks,
  listRetentionPolicies,
  listStorageConfigs,
  searchPlatformFiles,
} from "@/services/file-platform.service";

export const getFilePlatformOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FILES_VIEW });
  await ensureFilePlatformDefaults(context.business.id);
  const dashboard = await getFilePlatformDashboard(context.business.id);

  return {
    context,
    dashboard: serializeFilePlatformDashboard(dashboard),
  };
});

export const getFilePlatformFoldersContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FILES_VIEW });
  const folders = await listPlatformFolders(context.business.id);

  return {
    context,
    folders: folders.map(serializePlatformFolder),
  };
});

export const getFilePlatformRegistryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FILES_VIEW });
  const files = await listPlatformFiles(context.business.id);

  return {
    context,
    files: files.map(serializePlatformFile),
  };
});

export const getFilePlatformVersionsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FILES_VIEW });
  const files = await listPlatformFiles(context.business.id);
  const firstFile = files[0];
  const versions = firstFile
    ? await listPlatformFileVersions(firstFile.id, context.business.id)
    : [];

  return {
    context,
    versions: versions.map(serializePlatformFileVersion),
  };
});

export const getFilePlatformSharingContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FILES_VIEW });
  const shareLinks = await listPlatformShareLinks(context.business.id);

  return {
    context,
    shareLinks: shareLinks.map(serializeShareLink),
  };
});

export const getFilePlatformPermissionsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FILES_VIEW });
  const files = await listPlatformFiles(context.business.id);
  const firstFile = files[0];
  const permissions = firstFile
    ? await listPlatformFilePermissions(firstFile.id, context.business.id)
    : [];

  return {
    context,
    permissions,
  };
});

export const getFilePlatformRetentionContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FILES_VIEW });
  const policies = await listRetentionPolicies(context.business.id);

  return {
    context,
    policies: policies.map(serializeRetentionPolicy),
  };
});

export const getFilePlatformStorageContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FILES_VIEW });
  const providers = await listStorageConfigs(context.business.id);

  return {
    context,
    providers,
  };
});

export const getFilePlatformAuditContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FILES_VIEW });
  const auditLogs = await listPlatformFileAuditLogs(context.business.id);

  return {
    context,
    auditLogs: auditLogs.map(serializeFileAuditLog),
  };
});

export const getFilePlatformSearchContext = cache(async (query?: string) => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FILES_VIEW });
  const files = query ? await searchPlatformFiles(context, { query }) : [];

  return {
    context,
    files: files.map(serializePlatformFile),
  };
});
