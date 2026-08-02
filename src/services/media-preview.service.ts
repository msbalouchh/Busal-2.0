import "server-only";

import type { PlatformMediaFile } from "@prisma/client";

import { prepareMediaDownload } from "@/services/media-download-manager.service";
import { validateMediaChecksum } from "@/services/media-file-version-manager.service";

export interface MediaPreview {
  fileId: string;
  name: string;
  fileType: string;
  mimeType: string;
  size: number;
  thumbnailPath: string;
  checksumValid: boolean;
  previewContent: string;
  visibility: string;
}

export async function previewMediaFile(
  ownerId: string,
  file: PlatformMediaFile,
): Promise<MediaPreview> {
  const checksumResult = await validateMediaChecksum(ownerId, file.id);
  const download = await prepareMediaDownload(ownerId, file);

  return {
    fileId: file.id,
    name: file.name,
    fileType: file.fileType,
    mimeType: file.mimeType,
    size: file.size,
    thumbnailPath: file.thumbnailPath,
    checksumValid: checksumResult.valid,
    previewContent: download.content.slice(0, 2000),
    visibility: file.visibility,
  };
}
