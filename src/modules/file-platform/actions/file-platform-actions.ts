"use server";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import type {
  CreateFolderInput,
  CreateFileVersionInput,
  CreateRetentionPolicyInput,
  CreateShareLinkInput,
  QueueAiProcessingInput,
  SearchFilesInput,
  SetFilePermissionInput,
  UploadFileInput,
} from "@/modules/file-platform/types/file-platform-types";
import {
  archivePlatformFile,
  createPlatformFileVersion,
  createPlatformFolder,
  createPlatformShareLink,
  createRetentionPolicy,
  queuePlatformAiProcessing,
  restorePlatformFile,
  restorePlatformFileVersion,
  searchPlatformFiles,
  setPlatformFilePermission,
  softDeletePlatformFile,
  uploadPlatformFile,
} from "@/services/file-platform.service";

export async function uploadPlatformFileAction(input: UploadFileInput) {
  return protectedAction(PERMISSION_CODES.FILES_UPLOAD, async ({ platform }) =>
    uploadPlatformFile(platform, input),
  );
}

export async function createPlatformFolderAction(input: CreateFolderInput) {
  return protectedAction(PERMISSION_CODES.FILES_MANAGE, async ({ platform }) =>
    createPlatformFolder(platform, input),
  );
}

export async function createPlatformFileVersionAction(input: CreateFileVersionInput) {
  return protectedAction(PERMISSION_CODES.FILES_EDIT, async ({ platform }) =>
    createPlatformFileVersion(platform, input),
  );
}

export async function restorePlatformFileVersionAction(fileId: string, versionNumber: number) {
  return protectedAction(PERMISSION_CODES.FILES_EDIT, async ({ platform }) =>
    restorePlatformFileVersion(platform, fileId, versionNumber),
  );
}

export async function setPlatformFilePermissionAction(input: SetFilePermissionInput) {
  return protectedAction(PERMISSION_CODES.FILES_MANAGE, async ({ platform }) =>
    setPlatformFilePermission(platform, input),
  );
}

export async function createPlatformShareLinkAction(input: CreateShareLinkInput) {
  return protectedAction(PERMISSION_CODES.FILES_SHARE, async ({ platform }) =>
    createPlatformShareLink(platform, input),
  );
}

export async function softDeletePlatformFileAction(fileId: string) {
  return protectedAction(PERMISSION_CODES.FILES_DELETE, async ({ platform }) => {
    await softDeletePlatformFile(platform, fileId);
    return { success: true };
  });
}

export async function restorePlatformFileAction(fileId: string) {
  return protectedAction(PERMISSION_CODES.FILES_MANAGE, async ({ platform }) => {
    await restorePlatformFile(platform, fileId);
    return { success: true };
  });
}

export async function archivePlatformFileAction(fileId: string) {
  return protectedAction(PERMISSION_CODES.FILES_MANAGE, async ({ platform }) => {
    await archivePlatformFile(platform, fileId);
    return { success: true };
  });
}

export async function queuePlatformAiProcessingAction(input: QueueAiProcessingInput) {
  return protectedAction(PERMISSION_CODES.FILES_MANAGE, async ({ platform }) =>
    queuePlatformAiProcessing(platform, input),
  );
}

export async function createRetentionPolicyAction(input: CreateRetentionPolicyInput) {
  return protectedAction(PERMISSION_CODES.FILES_ADMIN, async ({ platform }) =>
    createRetentionPolicy(platform, input),
  );
}

export async function searchPlatformFilesAction(input: SearchFilesInput) {
  return protectedAction(PERMISSION_CODES.FILES_VIEW, async ({ platform }) =>
    searchPlatformFiles(platform, input),
  );
}
