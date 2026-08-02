import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import { MEDIA_PLATFORM_ROUTES } from "@/modules/media-platform-management/constants/routes";
import {
  serializeMediaFile,
  serializeMediaFolder,
  serializeMediaPreview,
  serializeMediaSummary,
  serializeMediaTag,
  serializeStorageAnalytics,
} from "@/modules/media-platform-management/lib/media-platform-validation";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getMediaDashboardSummary,
  getMediaFile,
  getRecentMediaFiles,
  listMediaFiles,
} from "@/services/media-file.service";
import { listMediaFolders } from "@/services/media-folder-manager.service";
import { listMediaTags } from "@/services/media-tag-manager.service";
import { searchMediaFiles, searchMediaTags } from "@/services/media-search.service";
import { previewMediaFile } from "@/services/media-preview.service";
import { checkStorageQuota } from "@/services/media-permission-manager.service";
import { getUploadCenterStats } from "@/services/media-file-upload.service";
import { resolveMediaPlatformPermissions } from "@/services/media-platform-permission.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface MediaPlatformContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveMediaPlatformPermissions>;
}

async function resolveMediaBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getMediaPlatformContext = cache(async (): Promise<MediaPlatformContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveMediaBusiness(user);
  const permissionsFlags = resolveMediaPlatformPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  if (!permissionsFlags.canView) redirect(ROUTES.application);

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
});

export async function requireMediaPlatformActionContext(
  permission: string,
): Promise<MediaPlatformContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveMediaBusiness(user);
  const permissionsFlags = resolveMediaPlatformPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  const allowed = loaded.authorization.isOwner || loaded.authorization.permissions.has(permission);
  if (!allowed) throw permissionDenied();

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
}

export const getMediaDashboardContext = cache(async () => {
  const context = await getMediaPlatformContext();
  const [summary, recent] = await Promise.all([
    getMediaDashboardSummary(context.user.id),
    getRecentMediaFiles(context.user.id),
  ]);
  return {
    ...context,
    summary: serializeMediaSummary(summary),
    recentFiles: recent.map(serializeMediaFile),
  };
});

export const getMediaLibraryContext = cache(async () => {
  const context = await getMediaPlatformContext();
  const files = await listMediaFiles(context.user.id);
  return { ...context, files: files.map(serializeMediaFile) };
});

export const getMediaFoldersContext = cache(async () => {
  const context = await getMediaPlatformContext();
  const folders = await listMediaFolders(context.user.id);
  return { ...context, folders: folders.map(serializeMediaFolder) };
});

export const getMediaUploadContext = cache(async () => {
  const context = await getMediaPlatformContext();
  const uploadStats = await getUploadCenterStats(context.user.id);
  return {
    ...context,
    recentUploads: uploadStats.recentUploads.map(
      (file: { id: string; name: string; size: number; createdAt: Date }) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
      }),
    ),
  };
});

export const getMediaFileDetailContext = cache(async (fileId: string) => {
  const context = await getMediaPlatformContext();
  const file = await getMediaFile(context.user.id, fileId);
  if (!file || file.deletedAt) redirect(MEDIA_PLATFORM_ROUTES.library());

  const preview = await previewMediaFile(context.user.id, file);
  return {
    ...context,
    file: serializeMediaFile(file),
    preview: serializeMediaPreview(preview),
  };
});

export const getMediaTagsContext = cache(async () => {
  const context = await getMediaPlatformContext();
  const tags = await listMediaTags(context.user.id);
  return { ...context, tags: tags.map(serializeMediaTag) };
});

export const getMediaAnalyticsContext = cache(async () => {
  const context = await getMediaPlatformContext();
  const [summary, quota] = await Promise.all([
    getMediaDashboardSummary(context.user.id),
    checkStorageQuota(context.user.id),
  ]);
  return {
    ...context,
    analytics: serializeStorageAnalytics(summary, quota),
  };
});

export const getMediaSearchContext = cache(async (query?: string) => {
  const context = await getMediaPlatformContext();
  const trimmed = query?.trim() ?? "";
  if (!trimmed) {
    return { ...context, search: "", results: { files: [], tags: [] } };
  }

  const [files, tags] = await Promise.all([
    searchMediaFiles(context.user.id, trimmed),
    searchMediaTags(context.user.id, trimmed),
  ]);

  return {
    ...context,
    search: trimmed,
    results: {
      files: files.map(serializeMediaFile),
      tags: tags.map((tag) => serializeMediaTag(tag)),
    },
  };
});

export const getMediaRecycleContext = cache(async () => {
  const context = await getMediaPlatformContext();
  const files = await listMediaFiles(context.user.id, { deleted: true });
  return { ...context, files: files.map(serializeMediaFile) };
});
