import type { CommunicationAttachmentType } from "@prisma/client";

import type { PlatformFileReference } from "@/modules/communication/types/communication-types";

export function inferAttachmentType(mimeType: string): CommunicationAttachmentType {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (mimeType.startsWith("video/")) return "VIDEO";
  return "OFFICE_DOCUMENT";
}

export function createPlatformFileReference(
  input: PlatformFileReference & { attachmentType?: CommunicationAttachmentType },
): PlatformFileReference & { attachmentType: CommunicationAttachmentType } {
  return {
    fileName: input.fileName,
    mimeType: input.mimeType,
    storageKey: input.storageKey,
    fileSizeBytes: input.fileSizeBytes,
    attachmentType: input.attachmentType ?? inferAttachmentType(input.mimeType),
  };
}

export function validateStorageKey(storageKey: string): boolean {
  return storageKey.length > 0 && !storageKey.includes("..");
}
