"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { MEDIA_PLATFORM_ROUTES } from "@/modules/media-platform-management/constants/routes";
import { requireMediaPlatformActionContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import {
  validateFolderName,
  validateMediaName,
  validateTagName,
} from "@/modules/media-platform-management/lib/media-platform-validation";
import {
  permanentlyDeleteMediaFile,
  restoreMediaFile,
  softDeleteMediaFile,
  toggleMediaFavorite,
  updateMediaFile,
} from "@/services/media-file.service";
import { uploadMediaFile, uploadMediaFilesBulk } from "@/services/media-file-upload.service";
import { createMediaFolder, deleteMediaFolder } from "@/services/media-folder-manager.service";
import { createMediaTag, deleteMediaTag, tagMediaFile } from "@/services/media-tag-manager.service";
import { getMediaFile } from "@/services/media-file.service";
import { prepareMediaDownload } from "@/services/media-download-manager.service";

function revalidateMediaPages(fileId?: string): void {
  const routes = [
    MEDIA_PLATFORM_ROUTES.dashboard(),
    MEDIA_PLATFORM_ROUTES.library(),
    MEDIA_PLATFORM_ROUTES.folders(),
    MEDIA_PLATFORM_ROUTES.upload(),
    MEDIA_PLATFORM_ROUTES.tags(),
    MEDIA_PLATFORM_ROUTES.analytics(),
    MEDIA_PLATFORM_ROUTES.search(),
    MEDIA_PLATFORM_ROUTES.recycle(),
  ];
  for (const route of routes) revalidatePath(route);
  if (fileId) revalidatePath(MEDIA_PLATFORM_ROUTES.fileDetail(fileId));
}

export async function uploadMediaFileAction(input: {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  contentBase64?: string;
  folderId?: string;
}) {
  const context = await requireMediaPlatformActionContext(PERMISSION_CODES.MEDIA_UPLOAD);
  if (!input.contentBase64) {
    throw new Error("File content is required.");
  }

  const content = Buffer.from(input.contentBase64, "base64");
  const file = await uploadMediaFile(context.user.id, {
    name: validateMediaName(input.name),
    originalName: input.originalName,
    mimeType: input.mimeType,
    size: input.size || content.length,
    content,
    folderId: input.folderId,
  });
  revalidateMediaPages(file?.id);
  return { id: file?.id ?? "" };
}

export async function bulkUploadMediaAction(
  files: Array<{
    name: string;
    mimeType: string;
    size: number;
    contentBase64: string;
  }>,
  folderId?: string,
) {
  const context = await requireMediaPlatformActionContext(PERMISSION_CODES.MEDIA_UPLOAD);
  const uploaded = await uploadMediaFilesBulk(
    context.user.id,
    files.map((file) => ({
      name: validateMediaName(file.name),
      originalName: file.name,
      mimeType: file.mimeType,
      size: file.size || Buffer.from(file.contentBase64, "base64").length,
      content: Buffer.from(file.contentBase64, "base64"),
      folderId,
    })),
  );
  revalidateMediaPages();
  return { ids: uploaded.map((file) => file?.id ?? "") };
}

export async function updateMediaFileAction(
  fileId: string,
  input: {
    name?: string;
    visibility?: "PRIVATE" | "BUSINESS" | "PUBLIC";
    folderId?: string | null;
  },
) {
  const context = await requireMediaPlatformActionContext(PERMISSION_CODES.MEDIA_UPDATE);
  await updateMediaFile(context.user.id, fileId, {
    ...input,
    ...(input.name ? { name: validateMediaName(input.name) } : {}),
  });
  revalidateMediaPages(fileId);
}

export async function toggleFavoriteAction(fileId: string) {
  const context = await requireMediaPlatformActionContext(PERMISSION_CODES.MEDIA_UPDATE);
  await toggleMediaFavorite(context.user.id, fileId);
  revalidateMediaPages(fileId);
}

export async function softDeleteMediaFileAction(fileId: string) {
  const context = await requireMediaPlatformActionContext(PERMISSION_CODES.MEDIA_DELETE);
  await softDeleteMediaFile(context.user.id, fileId);
  revalidateMediaPages(fileId);
}

export async function restoreMediaFileAction(fileId: string) {
  const context = await requireMediaPlatformActionContext(PERMISSION_CODES.MEDIA_UPDATE);
  await restoreMediaFile(context.user.id, fileId);
  revalidateMediaPages(fileId);
}

export async function permanentlyDeleteMediaFileAction(fileId: string) {
  const context = await requireMediaPlatformActionContext(PERMISSION_CODES.MEDIA_DELETE);
  await permanentlyDeleteMediaFile(context.user.id, fileId);
  revalidateMediaPages(fileId);
}

export async function downloadMediaFileAction(fileId: string) {
  const context = await requireMediaPlatformActionContext(PERMISSION_CODES.MEDIA_DOWNLOAD);
  const file = await getMediaFile(context.user.id, fileId);
  if (!file) throw new Error("File not found");
  return prepareMediaDownload(context.user.id, file);
}

export async function createMediaFolderAction(input: {
  name: string;
  description?: string;
  parentId?: string;
}) {
  const context = await requireMediaPlatformActionContext(PERMISSION_CODES.MEDIA_UPLOAD);
  const folder = await createMediaFolder(context.user.id, {
    ...input,
    name: validateFolderName(input.name),
  });
  revalidateMediaPages();
  return { id: folder.id };
}

export async function deleteMediaFolderAction(folderId: string) {
  const context = await requireMediaPlatformActionContext(PERMISSION_CODES.MEDIA_DELETE);
  await deleteMediaFolder(context.user.id, folderId);
  revalidateMediaPages();
}

export async function createMediaTagAction(input: { name: string; color?: string }) {
  const context = await requireMediaPlatformActionContext(PERMISSION_CODES.MEDIA_UPDATE);
  const tag = await createMediaTag(context.user.id, {
    ...input,
    name: validateTagName(input.name),
  });
  revalidateMediaPages();
  return { id: tag.id };
}

export async function deleteMediaTagAction(tagId: string) {
  const context = await requireMediaPlatformActionContext(PERMISSION_CODES.MEDIA_DELETE);
  await deleteMediaTag(context.user.id, tagId);
  revalidateMediaPages();
}

export async function tagMediaFileAction(fileId: string, tagId: string) {
  const context = await requireMediaPlatformActionContext(PERMISSION_CODES.MEDIA_UPDATE);
  await tagMediaFile(context.user.id, fileId, tagId);
  revalidateMediaPages(fileId);
}
