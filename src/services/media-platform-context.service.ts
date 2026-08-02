import "server-only";

import { createHash } from "node:crypto";

import type { PlatformMediaType } from "@prisma/client";

import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

export async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export function computeMediaChecksum(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

export function buildMediaStoragePath(
  businessId: string,
  fileId: string,
  version: number,
  extension: string,
): string {
  const ext = extension ? `.${extension.replace(/^\./, "")}` : "";
  return `media/${businessId}/${fileId}/v${version}${ext}`;
}

export function buildMediaThumbnailPath(businessId: string, fileId: string): string {
  return `media/${businessId}/${fileId}/thumb.png`;
}

export function inferMediaType(mimeType: string, extension: string): PlatformMediaType {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation") ||
    ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "pdf"].includes(extension.toLowerCase())
  ) {
    return "DOCUMENT";
  }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("archive") ||
    ["zip", "rar", "7z", "tar", "gz"].includes(extension.toLowerCase())
  ) {
    return "ARCHIVE";
  }
  return "OTHER";
}

export function extractExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? "") : "";
}

/** Default storage quota per business (bytes) — framework only. */
export const DEFAULT_MEDIA_STORAGE_QUOTA_BYTES = 5 * 1024 * 1024 * 1024;
