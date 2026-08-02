import "server-only";

import type { PlatformMediaType } from "@prisma/client";

export interface ThumbnailResult {
  thumbnailPath: string;
  simulated: boolean;
  message: string;
}

export async function generateThumbnail(
  fileType: PlatformMediaType,
  storagePath: string,
): Promise<ThumbnailResult> {
  void fileType;
  void storagePath;
  return {
    thumbnailPath: storagePath.replace(/\/v\d+/, "/thumb").replace(/\.[^.]+$/, ".png"),
    simulated: true,
    message: "Thumbnail generation simulated — no external renderer configured",
  };
}
