import "server-only";

import type { PlatformMediaFile } from "@prisma/client";

import { computeMediaChecksum } from "@/services/media-platform-context.service";
import { downloadFromStorage, generateSignedUrl } from "@/services/media-storage-manager.service";
import { validateMediaChecksum } from "@/services/media-file-version-manager.service";
import { writeMediaAuditLog } from "@/services/media-audit-logger.service";
import { getOwnedBusinessId } from "@/services/media-platform-context.service";

export interface MediaDownloadPayload {
  fileId: string;
  name: string;
  mimeType: string;
  size: number;
  checksum: string;
  checksumValid: boolean;
  content: string;
  signedUrl: string;
  signedUrlExpiresAt: string;
  simulated: boolean;
}

export async function prepareMediaDownload(
  ownerId: string,
  file: PlatformMediaFile,
): Promise<MediaDownloadPayload> {
  const businessId = await getOwnedBusinessId(ownerId);
  const checksumResult = await validateMediaChecksum(ownerId, file.id);
  const buffer =
    (await downloadFromStorage(file.storageProvider, file.storagePath)) ?? Buffer.from("", "utf8");
  const signed = await generateSignedUrl(file.storageProvider, file.storagePath);

  await writeMediaAuditLog(businessId, {
    action: "media.downloaded",
    entityId: file.id,
    message: `File downloaded: ${file.name}`,
  });

  return {
    fileId: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
    checksum: file.checksum,
    checksumValid: checksumResult.valid,
    content: buffer.toString("utf8"),
    signedUrl: signed.url,
    signedUrlExpiresAt: signed.expiresAt,
    simulated: false,
  };
}

export async function prepareBulkDownload(
  ownerId: string,
  files: PlatformMediaFile[],
): Promise<MediaDownloadPayload[]> {
  const results = [];
  for (const file of files) {
    results.push(await prepareMediaDownload(ownerId, file));
  }
  return results;
}

export function validateDownloadChecksum(content: string | Buffer, expectedChecksum: string) {
  const checksum = computeMediaChecksum(content);
  return checksum === expectedChecksum;
}
