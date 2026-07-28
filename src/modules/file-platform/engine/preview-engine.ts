import type { FilePreviewType } from "@prisma/client";

export function inferPreviewType(mimeType: string): FilePreviewType | null {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("text/")) return "TEXT";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("officedocument")
  ) {
    return "OFFICE";
  }
  return null;
}

export function isPreviewSupported(mimeType: string): boolean {
  return inferPreviewType(mimeType) !== null;
}
