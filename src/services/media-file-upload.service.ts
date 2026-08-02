import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/media-platform-context.service";
import { createMediaFileRecord } from "@/services/media-file.service";
import { writeMediaAuditLog } from "@/services/media-audit-logger.service";

export interface UploadFileInput {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  content: string | Buffer;
  folderId?: string;
}

export async function uploadMediaFile(ownerId: string, input: UploadFileInput) {
  return createMediaFileRecord(ownerId, input);
}

export async function uploadMediaFilesBulk(ownerId: string, files: UploadFileInput[]) {
  const results = [];
  for (const file of files) {
    results.push(await uploadMediaFile(ownerId, file));
  }
  return results;
}

export async function simulateDragDropUpload(
  ownerId: string,
  files: Array<{ name: string; mimeType: string; size: number }>,
  folderId?: string,
) {
  return uploadMediaFilesBulk(
    ownerId,
    files.map((file) => ({
      name: file.name,
      originalName: file.name,
      mimeType: file.mimeType,
      size: file.size,
      content: Buffer.from(JSON.stringify({ simulated: true, name: file.name })),
      folderId,
    })),
  );
}

export async function getUploadCenterStats(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const recentUploads = await prisma.platformMediaFile.findMany({
    where: { businessId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, size: true, createdAt: true },
  });

  await writeMediaAuditLog(businessId, {
    action: "media.upload_center.viewed",
    entityId: businessId,
    message: "Upload center viewed",
  });

  return { recentUploads };
}
