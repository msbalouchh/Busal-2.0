import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  FILE_PLATFORM_ROUTES,
  FILE_STORAGE_PROVIDERS,
} from "../src/modules/file-platform/constants/routes";
import { planAiProcessingJob } from "../src/modules/file-platform/engine/ai-engine";
import {
  inferPreviewType,
  isPreviewSupported,
} from "../src/modules/file-platform/engine/preview-engine";
import {
  buildFileSearchWhere,
  buildFolderPath,
} from "../src/modules/file-platform/engine/search-engine";
import {
  computeChecksum,
  extractExtension,
} from "../src/modules/file-platform/engine/storage-engine";
import {
  DEFAULT_STORAGE_PROVIDERS,
  ensureBootstrapFilePlatform,
} from "../src/modules/file-platform/plugins/bootstrap-file-platform";
import { listStorageProviders } from "../src/modules/file-platform/registry/storage-registry";
import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  archivePlatformFile,
  comparePlatformFileVersions,
  createPlatformFileVersion,
  createPlatformFolder,
  createPlatformShareLink,
  createRetentionPolicy,
  downloadPlatformFile,
  ensureFilePlatformDefaults,
  evaluateFilePermissionLevel,
  getFilePlatformDashboard,
  listPlatformFileAuditLogs,
  previewPlatformFile,
  queuePlatformAiProcessing,
  restorePlatformFile,
  restorePlatformFileVersion,
  searchPlatformFiles,
  setPlatformFilePermission,
  softDeletePlatformFile,
  uploadPlatformFile,
} from "../src/services/file-platform.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function buildPlatformContext(businessId: string): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true },
  });

  assert(businessRecord?.owner, "Business owner missing");

  const business = await getOwnedBusinessById(businessRecord.ownerId, businessId);
  assert(business, "Business profile missing");

  const user = mapProfileToAuthUser(
    businessRecord.owner.id,
    businessRecord.owner.email,
    businessRecord.owner,
    {},
  );
  const authorization = await resolveAuthorizationContext(user, business);

  return {
    user,
    business,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [
      { id: business.id, name: business.businessName ?? "Business", isOnboarded: true },
    ],
    accessibleBranches: [],
  };
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/file-platform/index.ts",
    "src/modules/file-platform/constants/routes.ts",
    "src/modules/file-platform/types/file-platform-types.ts",
    "src/modules/file-platform/registry/storage-registry.ts",
    "src/modules/file-platform/engine/storage-engine.ts",
    "src/modules/file-platform/engine/preview-engine.ts",
    "src/modules/file-platform/engine/search-engine.ts",
    "src/modules/file-platform/engine/ai-engine.ts",
    "src/modules/file-platform/plugins/bootstrap-file-platform.ts",
    "src/modules/file-platform/utils/file-platform-utils.ts",
    "src/modules/file-platform/lib/get-file-platform-context.ts",
    "src/modules/file-platform/actions/file-platform-actions.ts",
    "src/modules/file-platform/components/file-platform-dashboard.tsx",
    "src/modules/file-platform/components/file-platform-lists.tsx",
    "src/modules/file-platform/components/file-platform-nav.tsx",
    "src/services/file-platform.service.ts",
    "src/app/dashboard/files/page.tsx",
    "src/app/dashboard/files/folders/page.tsx",
    "src/app/dashboard/files/registry/page.tsx",
    "src/app/dashboard/files/versions/page.tsx",
    "src/app/dashboard/files/sharing/page.tsx",
    "src/app/dashboard/files/permissions/page.tsx",
    "src/app/dashboard/files/retention/page.tsx",
    "src/app/dashboard/files/storage/page.tsx",
    "src/app/dashboard/files/audit/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("File platform routes");
  assert(FILE_PLATFORM_ROUTES.overview === "/dashboard/files", "Overview route mismatch");
  assert(FILE_PLATFORM_ROUTES.registry.includes("registry"), "Registry route missing");
  console.log("  PASS");

  console.log("Permission protected");
  const permissionsSource = readFileSync(
    join(root, "src/modules/authorization/constants/permissions.ts"),
    "utf8",
  );
  assert(permissionsSource.includes("files.view"), "files.view missing");
  assert(permissionsSource.includes("files.admin"), "files.admin missing");
  assert(ALL_PERMISSION_CODES.includes(PERMISSION_CODES.FILES_UPLOAD), "Permission code missing");
  console.log("  PASS");

  console.log("Schema");
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schema.includes("model PlatformFile"), "PlatformFile missing");
  assert(schema.includes("model PlatformFileVersion"), "PlatformFileVersion missing");
  assert(schema.includes("model PlatformFileFolder"), "PlatformFileFolder missing");
  console.log("  PASS");

  console.log("Storage providers");
  ensureBootstrapFilePlatform();
  const providers = listStorageProviders();
  assert(providers.length >= DEFAULT_STORAGE_PROVIDERS.length, "Providers not registered");
  assert(
    providers.some((p) => p.provider === "AWS_S3" && !p.isIntegrated),
    "S3 architecture missing",
  );
  console.log("  PASS");

  console.log("Storage engine");
  const checksum = computeChecksum("verify-content");
  assert(checksum.length === 64, "Checksum generation failed");
  assert(extractExtension("document.pdf") === "pdf", "Extension extraction failed");
  console.log("  PASS");

  console.log("Preview engine");
  assert(inferPreviewType("application/pdf") === "PDF", "PDF preview type failed");
  assert(isPreviewSupported("image/png"), "Image preview support failed");
  console.log("  PASS");

  console.log("Search engine");
  const searchWhere = buildFileSearchWhere("biz", { query: "invoice", module: "contracts" });
  assert(searchWhere.AND, "Search where missing");
  assert(buildFolderPath("/business", "contracts") === "/business/contracts", "Folder path failed");
  console.log("  PASS");

  console.log("AI engine");
  const aiPlan = planAiProcessingJob("OCR");
  assert(aiPlan.status === "QUEUED", "AI job plan failed");
  console.log("  PASS");

  console.log("Permission engine");
  assert(
    evaluateFilePermissionLevel(["VIEW", "EDIT"], "DOWNLOAD"),
    "Permission level evaluation failed",
  );
  console.log("  PASS");

  console.log("Storage providers count");
  assert(FILE_STORAGE_PROVIDERS.length === 5, "Expected 5 storage providers");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  assert(business, "No business found");
  const platform = await buildPlatformContext(business.id);

  console.log("File platform defaults");
  await ensureFilePlatformDefaults(business.id);
  const storageCount = await prisma.platformFileStorageConfig.count({
    where: { businessId: business.id },
  });
  assert(storageCount >= 5, "Storage configs not seeded");
  console.log("  PASS");

  console.log("Create folder");
  const folder = await createPlatformFolder(platform, {
    folderType: "PROJECT",
    name: "Verify Project",
    department: "engineering",
  });
  assert(folder.id, "Folder not created");
  console.log("  PASS");

  console.log("Upload file");
  const uploaded = await uploadPlatformFile(platform, {
    module: "verify-file-platform",
    folderId: folder.id,
    originalName: "verify-document.pdf",
    mimeType: "application/pdf",
    content: "Verify file platform content v1",
    tags: ["verify", "document"],
    entityType: "project",
    entityId: "verify-project-1",
  });
  assert(uploaded.id, "File not uploaded");
  assert(uploaded.versionNumber === 1, "Initial version should be 1");
  console.log("  PASS");

  console.log("Create version");
  const version = await createPlatformFileVersion(platform, {
    fileId: uploaded.id,
    originalName: "verify-document.pdf",
    mimeType: "application/pdf",
    content: "Verify file platform content v2",
    changeNotes: "Updated content",
  });
  assert(version.versionNumber === 2, "Version 2 not created");
  console.log("  PASS");

  console.log("Compare versions");
  const comparison = await comparePlatformFileVersions(uploaded.id, business.id, 1, 2);
  assert(comparison.checksumChanged, "Checksum should differ between versions");
  console.log("  PASS");

  console.log("Restore version");
  const restored = await restorePlatformFileVersion(platform, uploaded.id, 1);
  assert(restored.versionNumber === 3, "Restore should create new version");
  console.log("  PASS");

  console.log("Set permissions");
  const permission = await setPlatformFilePermission(platform, {
    fileId: uploaded.id,
    scope: "BUSINESS",
    level: "VIEW",
  });
  assert(permission.id, "Permission not set");
  console.log("  PASS");

  console.log("Create share link");
  const shareLink = await createPlatformShareLink(platform, {
    fileId: uploaded.id,
    linkType: "EXPIRING",
    expiresAt: new Date(Date.now() + 86400000),
    downloadLimit: 10,
    password: "verify123",
  });
  assert(shareLink.token, "Share link not created");
  console.log("  PASS");

  console.log("Download file");
  const download = await downloadPlatformFile(platform, uploaded.id);
  assert(download.storageKey, "Download failed");
  console.log("  PASS");

  console.log("Preview file");
  const preview = await previewPlatformFile(platform, uploaded.id);
  assert(preview.supported, "Preview should be supported for PDF");
  console.log("  PASS");

  console.log("AI processing queue");
  const aiJob = await queuePlatformAiProcessing(platform, {
    fileId: uploaded.id,
    jobType: "SUMMARY",
  });
  assert(aiJob.id, "AI job not queued");
  console.log("  PASS");

  console.log("Search files");
  const searchResults = await searchPlatformFiles(platform, {
    query: "verify",
    module: "verify-file-platform",
    tags: ["verify"],
  });
  assert(searchResults.length > 0, "Search returned no results");
  console.log("  PASS");

  console.log("Soft delete and restore");
  await softDeletePlatformFile(platform, uploaded.id);
  let fileRecord = await prisma.platformFile.findUnique({ where: { id: uploaded.id } });
  assert(fileRecord?.status === "SOFT_DELETED", "Soft delete failed");
  await restorePlatformFile(platform, uploaded.id);
  fileRecord = await prisma.platformFile.findUnique({ where: { id: uploaded.id } });
  assert(fileRecord?.status === "ACTIVE", "Restore failed");
  console.log("  PASS");

  console.log("Archive file");
  await archivePlatformFile(platform, uploaded.id);
  fileRecord = await prisma.platformFile.findUnique({ where: { id: uploaded.id } });
  assert(fileRecord?.status === "ARCHIVED", "Archive failed");
  await restorePlatformFile(platform, uploaded.id);
  console.log("  PASS");

  console.log("Retention policy");
  const policy = await createRetentionPolicy(platform, {
    name: "Verify Module Retention",
    module: "verify-file-platform",
    retentionDays: 90,
    action: "ARCHIVE",
  });
  assert(policy.id, "Retention policy not created");
  console.log("  PASS");

  console.log("File platform dashboard");
  const dashboard = await getFilePlatformDashboard(business.id);
  assert(dashboard.totalFiles > 0, "Dashboard total files missing");
  assert(dashboard.totalFolders > 0, "Dashboard folders missing");
  console.log("  PASS");

  console.log("Audit logs");
  const auditLogs = await listPlatformFileAuditLogs(business.id);
  assert(
    auditLogs.some((log) => log.eventType === "UPLOAD"),
    "Upload audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "DOWNLOAD"),
    "Download audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "SHARE"),
    "Share audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "AI_PROCESSING"),
    "AI audit missing",
  );
  console.log("  PASS");

  console.log("Extensibility registry");
  assert(
    providers.some((p) => p.provider === "CLOUDFLARE_R2"),
    "R2 provider missing",
  );
  console.log("  PASS");

  console.log("\nUniversal File & Document Management Platform verification passed.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
