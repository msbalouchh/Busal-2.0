import "server-only";

import { prisma } from "@/lib/prisma";
import {
  computeMediaChecksum,
  getOwnedBusinessId,
} from "@/services/media-platform-context.service";

export async function createMediaFileVersion(
  ownerId: string,
  fileId: string,
  input: { version: number; storagePath: string; checksum: string; size: number },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const file = await prisma.platformMediaFile.findFirst({
    where: { id: fileId, businessId },
  });
  if (!file) return null;

  return prisma.platformMediaFileVersion.create({
    data: {
      fileId,
      version: input.version,
      storagePath: input.storagePath,
      checksum: input.checksum,
      size: input.size,
      createdBy: ownerId,
    },
  });
}

export async function listMediaFileVersions(ownerId: string, fileId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const file = await prisma.platformMediaFile.findFirst({
    where: { id: fileId, businessId },
  });
  if (!file) return [];

  return prisma.platformMediaFileVersion.findMany({
    where: { fileId },
    orderBy: { version: "desc" },
  });
}

export async function validateMediaChecksum(ownerId: string, fileId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const file = await prisma.platformMediaFile.findFirst({
    where: { id: fileId, businessId },
  });
  if (!file) return { valid: false, checksum: "" };

  const latestVersion = await prisma.platformMediaFileVersion.findFirst({
    where: { fileId },
    orderBy: { version: "desc" },
  });

  const expected = latestVersion?.checksum ?? file.checksum;
  const valid = expected === file.checksum && file.checksum.length > 0;
  return { valid, checksum: file.checksum, expectedChecksum: expected };
}

export async function incrementMediaFileVersion(
  ownerId: string,
  fileId: string,
  input: { storagePath: string; content: string | Buffer; size: number },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const file = await prisma.platformMediaFile.findFirst({
    where: { id: fileId, businessId, deletedAt: null },
  });
  if (!file) return null;

  const contentBuffer =
    typeof input.content === "string" ? Buffer.from(input.content, "utf8") : input.content;
  const checksum = computeMediaChecksum(contentBuffer);
  const nextVersion = file.version + 1;

  await createMediaFileVersion(ownerId, fileId, {
    version: nextVersion,
    storagePath: input.storagePath,
    checksum,
    size: input.size,
  });

  return prisma.platformMediaFile.update({
    where: { id: fileId },
    data: {
      version: nextVersion,
      storagePath: input.storagePath,
      checksum,
      size: input.size,
    },
  });
}
