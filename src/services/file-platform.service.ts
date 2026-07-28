import "server-only";

import { createHash, randomUUID } from "node:crypto";

import type {
  FileAuditEventType,
  FilePermissionLevel,
  FilePermissionScope,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import { DEFAULT_RETENTION_DAYS } from "@/modules/file-platform/constants/routes";
import {
  planAiProcessingJob,
  simulateAiProcessingResult,
} from "@/modules/file-platform/engine/ai-engine";
import {
  inferPreviewType,
  isPreviewSupported,
} from "@/modules/file-platform/engine/preview-engine";
import {
  buildFileSearchWhere,
  buildFolderPath,
} from "@/modules/file-platform/engine/search-engine";
import { extractExtension, getStorageAdapter } from "@/modules/file-platform/engine/storage-engine";
import { ensureBootstrapFilePlatform } from "@/modules/file-platform/plugins/bootstrap-file-platform";
import type {
  CreateFolderInput,
  CreateFileVersionInput,
  CreateRetentionPolicyInput,
  CreateShareLinkInput,
  FilePlatformDashboardMetrics,
  FileVersionCompareResult,
  QueueAiProcessingInput,
  SearchFilesInput,
  SetFilePermissionInput,
  UploadFileInput,
} from "@/modules/file-platform/types/file-platform-types";

function assertPermission(platform: BusinessContext, permission: string): void {
  const context = toPermissionEvaluationContext({
    permissions: platform.permissions,
    roleSlug: platform.roleSlug,
    isOwner: platform.isOwner,
    businessId: platform.business.id,
    branchId: platform.branchId,
  });

  if (!evaluatePermission(context, permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

async function getStaffIdForPlatform(platform: BusinessContext): Promise<string | null> {
  const staff = await prisma.staff.findFirst({
    where: { businessId: platform.business.id, userId: platform.user.id },
  });
  return staff?.id ?? null;
}

async function logFileAudit(input: {
  businessId: string;
  fileId?: string | null;
  eventType: FileAuditEventType;
  userId?: string | null;
  staffId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.platformFileAuditLog.create({
    data: {
      businessId: input.businessId,
      fileId: input.fileId ?? null,
      eventType: input.eventType,
      userId: input.userId ?? null,
      staffId: input.staffId ?? null,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

async function getDefaultStorageProvider(businessId: string) {
  const config = await prisma.platformFileStorageConfig.findFirst({
    where: { businessId, isDefault: true, isEnabled: true },
  });
  return config?.provider ?? "LOCAL";
}

export async function ensureFilePlatformDefaults(businessId: string): Promise<void> {
  ensureBootstrapFilePlatform();

  const providers = ["LOCAL", "AWS_S3", "AZURE_BLOB", "GOOGLE_CLOUD", "CLOUDFLARE_R2"] as const;

  for (const provider of providers) {
    const existing = await prisma.platformFileStorageConfig.findFirst({
      where: { businessId, provider },
    });

    if (existing) {
      continue;
    }

    await prisma.platformFileStorageConfig.create({
      data: {
        businessId,
        provider,
        name: provider.replace(/_/g, " "),
        isEnabled: provider === "LOCAL",
        isDefault: provider === "LOCAL",
        config: { integrated: provider === "LOCAL" },
      },
    });
  }

  const businessFolder = await prisma.platformFileFolder.findFirst({
    where: { businessId, folderType: "BUSINESS", path: "/business" },
  });

  if (!businessFolder) {
    await prisma.platformFileFolder.create({
      data: {
        businessId,
        folderType: "BUSINESS",
        name: "Business",
        slug: "business",
        path: "/business",
      },
    });
  }

  const retentionExists = await prisma.platformFileRetentionPolicy.findFirst({
    where: { businessId, name: "Default Retention Policy" },
  });

  if (!retentionExists) {
    await prisma.platformFileRetentionPolicy.create({
      data: {
        businessId,
        name: "Default Retention Policy",
        retentionDays: DEFAULT_RETENTION_DAYS,
        action: "ARCHIVE",
      },
    });
  }
}

export async function createPlatformFolder(
  platform: BusinessContext,
  input: CreateFolderInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.FILES_MANAGE);

  const slug = input.name.toLowerCase().replace(/\s+/g, "-");
  let parentPath: string | null = null;

  if (input.parentId) {
    const parent = await prisma.platformFileFolder.findFirst({
      where: { id: input.parentId, businessId: platform.business.id },
    });
    parentPath = parent?.path ?? null;
  }

  const path = buildFolderPath(parentPath, slug);

  const existing = await prisma.platformFileFolder.findFirst({
    where: { businessId: platform.business.id, path },
  });

  if (existing) {
    return { id: existing.id };
  }

  const folder = await prisma.platformFileFolder.create({
    data: {
      businessId: platform.business.id,
      branchId: platform.branchId,
      parentId: input.parentId ?? null,
      folderType: input.folderType,
      name: input.name,
      slug,
      path,
      department: input.department ?? null,
      projectId: input.projectId ?? null,
      customerId: input.customerId ?? null,
      ownerUserId: platform.user.id,
    },
  });

  return { id: folder.id };
}

export async function uploadPlatformFile(
  platform: BusinessContext,
  input: UploadFileInput,
): Promise<{ id: string; storageKey: string; versionNumber: number }> {
  assertPermission(platform, PERMISSION_CODES.FILES_UPLOAD);

  const provider = await getDefaultStorageProvider(platform.business.id);
  const adapter = getStorageAdapter(provider);
  const upload = await adapter.upload({
    businessId: platform.business.id,
    originalName: input.originalName,
    content: input.content,
  });

  const staffId = await getStaffIdForPlatform(platform);
  const extension = extractExtension(input.originalName);
  const previewType = inferPreviewType(input.mimeType);

  const file = await prisma.platformFile.create({
    data: {
      businessId: platform.business.id,
      branchId: platform.branchId,
      folderId: input.folderId ?? null,
      ownerUserId: platform.user.id,
      ownerStaffId: staffId,
      module: input.module,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      originalName: input.originalName,
      storedName: upload.storedName,
      mimeType: input.mimeType,
      extension,
      sizeBytes: upload.sizeBytes,
      checksum: upload.checksum,
      currentVersionNumber: 1,
      tags: input.tags ?? [],
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      storageProvider: provider,
      storageKey: upload.storageKey,
      previewType,
    },
  });

  await prisma.platformFileVersion.create({
    data: {
      fileId: file.id,
      businessId: platform.business.id,
      versionNumber: 1,
      storedName: upload.storedName,
      storageKey: upload.storageKey,
      sizeBytes: upload.sizeBytes,
      checksum: upload.checksum,
      authorUserId: platform.user.id,
      authorStaffId: staffId,
      changeNotes: input.changeNotes ?? "Initial upload",
    },
  });

  await prisma.platformFilePermission.create({
    data: {
      fileId: file.id,
      businessId: platform.business.id,
      scope: "OWNER",
      scopeRef: platform.user.id,
      level: "EDIT",
    },
  });

  await logFileAudit({
    businessId: platform.business.id,
    fileId: file.id,
    eventType: "UPLOAD",
    userId: platform.user.id,
    staffId,
    metadata: { module: input.module, version: 1 },
  });

  return { id: file.id, storageKey: upload.storageKey, versionNumber: 1 };
}

export async function createPlatformFileVersion(
  platform: BusinessContext,
  input: CreateFileVersionInput,
): Promise<{ id: string; versionNumber: number }> {
  assertPermission(platform, PERMISSION_CODES.FILES_EDIT);

  const file = await prisma.platformFile.findFirst({
    where: { id: input.fileId, businessId: platform.business.id, status: "ACTIVE" },
  });

  if (!file) {
    throw new Error("File not found");
  }

  const provider = file.storageProvider;
  const adapter = getStorageAdapter(provider);
  const upload = await adapter.upload({
    businessId: platform.business.id,
    originalName: input.originalName,
    content: input.content,
  });

  const staffId = await getStaffIdForPlatform(platform);
  const nextVersion = file.currentVersionNumber + 1;

  const version = await prisma.platformFileVersion.create({
    data: {
      fileId: file.id,
      businessId: platform.business.id,
      versionNumber: nextVersion,
      storedName: upload.storedName,
      storageKey: upload.storageKey,
      sizeBytes: upload.sizeBytes,
      checksum: upload.checksum,
      authorUserId: platform.user.id,
      authorStaffId: staffId,
      changeNotes: input.changeNotes ?? `Version ${nextVersion}`,
    },
  });

  await prisma.platformFile.update({
    where: { id: file.id },
    data: {
      currentVersionNumber: nextVersion,
      storedName: upload.storedName,
      storageKey: upload.storageKey,
      sizeBytes: upload.sizeBytes,
      checksum: upload.checksum,
      mimeType: input.mimeType,
      originalName: input.originalName,
      extension: extractExtension(input.originalName),
      previewType: inferPreviewType(input.mimeType),
    },
  });

  await logFileAudit({
    businessId: platform.business.id,
    fileId: file.id,
    eventType: "UPLOAD",
    userId: platform.user.id,
    staffId,
    metadata: { version: nextVersion },
  });

  return { id: version.id, versionNumber: nextVersion };
}

export async function restorePlatformFileVersion(
  platform: BusinessContext,
  fileId: string,
  versionNumber: number,
): Promise<{ versionNumber: number }> {
  assertPermission(platform, PERMISSION_CODES.FILES_EDIT);

  const version = await prisma.platformFileVersion.findFirst({
    where: { fileId, versionNumber, businessId: platform.business.id },
  });

  if (!version) {
    throw new Error("Version not found");
  }

  const staffId = await getStaffIdForPlatform(platform);
  const nextVersion =
    (await prisma.platformFile.findUnique({ where: { id: fileId } }))!.currentVersionNumber + 1;

  await prisma.platformFileVersion.create({
    data: {
      fileId,
      businessId: platform.business.id,
      versionNumber: nextVersion,
      storedName: version.storedName,
      storageKey: version.storageKey,
      sizeBytes: version.sizeBytes,
      checksum: version.checksum,
      authorUserId: platform.user.id,
      authorStaffId: staffId,
      changeNotes: `Restored from version ${versionNumber}`,
    },
  });

  await prisma.platformFile.update({
    where: { id: fileId },
    data: {
      currentVersionNumber: nextVersion,
      storedName: version.storedName,
      storageKey: version.storageKey,
      sizeBytes: version.sizeBytes,
      checksum: version.checksum,
    },
  });

  await logFileAudit({
    businessId: platform.business.id,
    fileId,
    eventType: "VERSION_RESTORE",
    userId: platform.user.id,
    staffId,
    metadata: { restoredFrom: versionNumber, newVersion: nextVersion },
  });

  return { versionNumber: nextVersion };
}

export async function comparePlatformFileVersions(
  fileId: string,
  businessId: string,
  fromVersion: number,
  toVersion: number,
): Promise<FileVersionCompareResult> {
  const [from, to] = await Promise.all([
    prisma.platformFileVersion.findFirst({
      where: { fileId, businessId, versionNumber: fromVersion },
    }),
    prisma.platformFileVersion.findFirst({
      where: { fileId, businessId, versionNumber: toVersion },
    }),
  ]);

  if (!from || !to) {
    throw new Error("Versions not found");
  }

  return {
    fromVersion,
    toVersion,
    sizeDelta: to.sizeBytes - from.sizeBytes,
    checksumChanged: from.checksum !== to.checksum,
  };
}

export async function setPlatformFilePermission(
  platform: BusinessContext,
  input: SetFilePermissionInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.FILES_MANAGE);

  const permission = await prisma.platformFilePermission.create({
    data: {
      fileId: input.fileId,
      businessId: platform.business.id,
      scope: input.scope,
      scopeRef: input.scopeRef ?? null,
      level: input.level,
    },
  });

  const staffId = await getStaffIdForPlatform(platform);

  await logFileAudit({
    businessId: platform.business.id,
    fileId: input.fileId,
    eventType: "PERMISSION_CHANGE",
    userId: platform.user.id,
    staffId,
    metadata: { scope: input.scope, level: input.level },
  });

  return { id: permission.id };
}

export async function createPlatformShareLink(
  platform: BusinessContext,
  input: CreateShareLinkInput,
): Promise<{ id: string; token: string }> {
  assertPermission(platform, PERMISSION_CODES.FILES_SHARE);

  const token = randomUUID().replace(/-/g, "");
  const passwordHash = input.password
    ? createHash("sha256").update(input.password).digest("hex")
    : null;

  const link = await prisma.platformFileShareLink.create({
    data: {
      fileId: input.fileId,
      businessId: platform.business.id,
      linkType: input.linkType,
      token,
      passwordHash,
      expiresAt: input.expiresAt ?? null,
      downloadLimit: input.downloadLimit ?? null,
      createdByUserId: platform.user.id,
    },
  });

  const staffId = await getStaffIdForPlatform(platform);

  await logFileAudit({
    businessId: platform.business.id,
    fileId: input.fileId,
    eventType: "SHARE",
    userId: platform.user.id,
    staffId,
    metadata: { linkType: input.linkType },
  });

  return { id: link.id, token: link.token };
}

export async function downloadPlatformFile(
  platform: BusinessContext,
  fileId: string,
): Promise<{ storageKey: string; originalName: string }> {
  assertPermission(platform, PERMISSION_CODES.FILES_DOWNLOAD);

  const file = await prisma.platformFile.findFirst({
    where: { id: fileId, businessId: platform.business.id, status: { in: ["ACTIVE", "ARCHIVED"] } },
  });

  if (!file) {
    throw new Error("File not found");
  }

  const adapter = getStorageAdapter(file.storageProvider);
  const result = await adapter.download(file.storageKey);

  if (!result.exists) {
    throw new Error("File not available in storage");
  }

  const staffId = await getStaffIdForPlatform(platform);

  await logFileAudit({
    businessId: platform.business.id,
    fileId,
    eventType: "DOWNLOAD",
    userId: platform.user.id,
    staffId,
  });

  return { storageKey: file.storageKey, originalName: file.originalName };
}

export async function previewPlatformFile(
  platform: BusinessContext,
  fileId: string,
): Promise<{ previewType: string | null; supported: boolean }> {
  assertPermission(platform, PERMISSION_CODES.FILES_VIEW);

  const file = await prisma.platformFile.findFirst({
    where: { id: fileId, businessId: platform.business.id },
  });

  if (!file) {
    throw new Error("File not found");
  }

  const staffId = await getStaffIdForPlatform(platform);

  await logFileAudit({
    businessId: platform.business.id,
    fileId,
    eventType: "PREVIEW",
    userId: platform.user.id,
    staffId,
  });

  return {
    previewType: file.previewType,
    supported: isPreviewSupported(file.mimeType),
  };
}

export async function softDeletePlatformFile(
  platform: BusinessContext,
  fileId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.FILES_DELETE);

  const staffId = await getStaffIdForPlatform(platform);

  await prisma.platformFile.updateMany({
    where: { id: fileId, businessId: platform.business.id },
    data: { status: "SOFT_DELETED", deletedAt: new Date() },
  });

  await logFileAudit({
    businessId: platform.business.id,
    fileId,
    eventType: "DELETE",
    userId: platform.user.id,
    staffId,
    metadata: { type: "soft" },
  });
}

export async function restorePlatformFile(
  platform: BusinessContext,
  fileId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.FILES_MANAGE);

  const staffId = await getStaffIdForPlatform(platform);

  await prisma.platformFile.updateMany({
    where: { id: fileId, businessId: platform.business.id },
    data: { status: "ACTIVE", deletedAt: null, archivedAt: null },
  });

  await logFileAudit({
    businessId: platform.business.id,
    fileId,
    eventType: "RESTORE",
    userId: platform.user.id,
    staffId,
  });
}

export async function archivePlatformFile(
  platform: BusinessContext,
  fileId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.FILES_MANAGE);

  const staffId = await getStaffIdForPlatform(platform);

  await prisma.platformFile.updateMany({
    where: { id: fileId, businessId: platform.business.id },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });

  await logFileAudit({
    businessId: platform.business.id,
    fileId,
    eventType: "ARCHIVE",
    userId: platform.user.id,
    staffId,
  });
}

export async function applyLegalHold(platform: BusinessContext, fileId: string): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.FILES_ADMIN);

  await prisma.platformFile.updateMany({
    where: { id: fileId, businessId: platform.business.id },
    data: { status: "LEGAL_HOLD", legalHoldAt: new Date() },
  });
}

export async function queuePlatformAiProcessing(
  platform: BusinessContext,
  input: QueueAiProcessingInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.FILES_MANAGE);

  const plan = planAiProcessingJob(input.jobType);

  const job = await prisma.platformFileAiJob.create({
    data: {
      fileId: input.fileId,
      businessId: platform.business.id,
      jobType: input.jobType,
      status: plan.status,
      result: simulateAiProcessingResult(input.jobType) as Prisma.InputJsonValue,
    },
  });

  const staffId = await getStaffIdForPlatform(platform);

  await logFileAudit({
    businessId: platform.business.id,
    fileId: input.fileId,
    eventType: "AI_PROCESSING",
    userId: platform.user.id,
    staffId,
    metadata: { jobType: input.jobType, architectureReady: true },
  });

  return { id: job.id };
}

export async function createRetentionPolicy(
  platform: BusinessContext,
  input: CreateRetentionPolicyInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.FILES_ADMIN);

  const policy = await prisma.platformFileRetentionPolicy.findFirst({
    where: { businessId: platform.business.id, name: input.name },
  });

  if (policy) {
    return { id: policy.id };
  }

  const created = await prisma.platformFileRetentionPolicy.create({
    data: {
      businessId: platform.business.id,
      name: input.name,
      module: input.module ?? null,
      retentionDays: input.retentionDays,
      action: input.action ?? "ARCHIVE",
    },
  });

  return { id: created.id };
}

export async function searchPlatformFiles(platform: BusinessContext, input: SearchFilesInput) {
  assertPermission(platform, PERMISSION_CODES.FILES_VIEW);

  return prisma.platformFile.findMany({
    where: buildFileSearchWhere(platform.business.id, input),
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listPlatformFiles(businessId: string, module?: string) {
  return prisma.platformFile.findMany({
    where: {
      businessId,
      status: { not: "PERMANENTLY_DELETED" },
      ...(module ? { module } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listPlatformFolders(businessId: string) {
  return prisma.platformFileFolder.findMany({
    where: { businessId },
    orderBy: { path: "asc" },
  });
}

export async function listPlatformFileVersions(fileId: string, businessId: string) {
  return prisma.platformFileVersion.findMany({
    where: { fileId, businessId },
    orderBy: { versionNumber: "desc" },
  });
}

export async function listPlatformShareLinks(businessId: string) {
  return prisma.platformFileShareLink.findMany({
    where: { businessId, isActive: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listPlatformFilePermissions(fileId: string, businessId: string) {
  return prisma.platformFilePermission.findMany({
    where: { fileId, businessId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listPlatformFileAuditLogs(businessId: string, limit = 100) {
  return prisma.platformFileAuditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listRetentionPolicies(businessId: string) {
  return prisma.platformFileRetentionPolicy.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listStorageConfigs(businessId: string) {
  return prisma.platformFileStorageConfig.findMany({
    where: { businessId },
    orderBy: { provider: "asc" },
  });
}

export async function getFilePlatformDashboard(
  businessId: string,
): Promise<FilePlatformDashboardMetrics> {
  const [totalFiles, activeFiles, totalFolders, sharedLinks, archivedFiles, storageProviders] =
    await Promise.all([
      prisma.platformFile.count({ where: { businessId } }),
      prisma.platformFile.count({ where: { businessId, status: "ACTIVE" } }),
      prisma.platformFileFolder.count({ where: { businessId } }),
      prisma.platformFileShareLink.count({ where: { businessId, isActive: true } }),
      prisma.platformFile.count({ where: { businessId, status: "ARCHIVED" } }),
      prisma.platformFileStorageConfig.count({ where: { businessId, isEnabled: true } }),
    ]);

  return {
    totalFiles,
    activeFiles,
    totalFolders,
    sharedLinks,
    archivedFiles,
    storageProviders,
  };
}

export async function registerPlatformFileReference(input: {
  businessId: string;
  module: string;
  entityType?: string;
  entityId?: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
}): Promise<{ id: string }> {
  ensureBootstrapFilePlatform();

  const file = await prisma.platformFile.create({
    data: {
      businessId: input.businessId,
      module: input.module,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      originalName: input.originalName,
      storedName: input.originalName,
      mimeType: input.mimeType,
      extension: extractExtension(input.originalName),
      sizeBytes: input.sizeBytes,
      checksum: input.checksum,
      storageProvider: "LOCAL",
      storageKey: input.storageKey,
      previewType: inferPreviewType(input.mimeType),
    },
  });

  await prisma.platformFileVersion.create({
    data: {
      fileId: file.id,
      businessId: input.businessId,
      versionNumber: 1,
      storedName: input.originalName,
      storageKey: input.storageKey,
      sizeBytes: input.sizeBytes,
      checksum: input.checksum,
      changeNotes: "Registered reference",
    },
  });

  return { id: file.id };
}

export function evaluateFilePermissionLevel(
  levels: FilePermissionLevel[],
  required: FilePermissionLevel,
): boolean {
  const order: FilePermissionLevel[] = ["VIEW", "DOWNLOAD", "UPLOAD", "EDIT", "SHARE", "DELETE"];
  const maxLevel = levels.reduce((max, level) => {
    return order.indexOf(level) > order.indexOf(max) ? level : max;
  }, "VIEW" as FilePermissionLevel);

  return order.indexOf(maxLevel) >= order.indexOf(required);
}

export function matchesPermissionScope(
  scope: FilePermissionScope,
  scopeRef: string | null,
  context: { userId: string; roleSlug: string | null; businessId: string; branchId: string | null },
): boolean {
  switch (scope) {
    case "OWNER":
    case "USER":
      return scopeRef === context.userId;
    case "ROLE":
      return scopeRef === context.roleSlug;
    case "BUSINESS":
      return true;
    case "BRANCH":
      return scopeRef === context.branchId;
    default:
      return false;
  }
}
