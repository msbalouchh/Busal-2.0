import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { uploadMediaFile } from "../src/services/media-file-upload.service";
import { validateMediaChecksum } from "../src/services/media-file-version-manager.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

async function main() {
  console.log("Media Platform module structure");
  const moduleFiles = [
    "src/modules/media-platform-management/index.ts",
    "src/services/media-file.service.ts",
    "src/services/media-folder-manager.service.ts",
    "src/services/media-storage-manager.service.ts",
    "src/services/media-file-upload.service.ts",
    "src/app/app/media/page.tsx",
    "src/app/app/media/library/page.tsx",
    "prisma/migrations/20250731180200_media_platform/migration.sql",
    "prisma/migrations/20250731180300_media_platform_permissions/migration.sql",
  ];

  for (const file of moduleFiles) read(file);

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.MEDIA_VIEW), "MEDIA_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.MEDIA_UPLOAD), "MEDIA_UPLOAD missing");
  assert(permissions.includes(PERMISSION_CODES.MEDIA_DOWNLOAD), "MEDIA_DOWNLOAD missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model PlatformMediaFile"), "PlatformMediaFile missing");
  assert(schema.includes("model PlatformMediaFileVersion"), "PlatformMediaFileVersion missing");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const file = await uploadMediaFile(ownerId, {
    name: "Verify Sample",
    originalName: "verify-sample.png",
    mimeType: "image/png",
    size: 512,
    content: Buffer.from(JSON.stringify({ verify: true })),
  });
  assert(file?.id, "Media file upload failed");

  const checksum = await validateMediaChecksum(ownerId, file.id);
  assert(checksum.valid, "Checksum validation failed");

  console.log("Media Platform verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
