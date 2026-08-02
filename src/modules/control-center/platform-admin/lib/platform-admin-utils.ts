import type { BackupRecord, Prisma } from "@prisma/client";

import { PLATFORM_RELEASE_RECORD_TYPE } from "@/modules/control-center/platform-admin/constants/control-center-platform-admin";
import type { ControlCenterReleaseItem } from "@/modules/control-center/platform-admin/types/control-center-platform-admin-types";

export interface PlatformReleaseMetadata {
  recordType: typeof PLATFORM_RELEASE_RECORD_TYPE;
  version: string;
  releaseNotes: string;
  environment: string;
  rolloutStatus: string;
  scheduledAt?: string | null;
  deployedAt?: string | null;
  rollbackOf?: string | null;
  createdBy?: string | null;
}

export function parsePlatformReleaseMetadata(metadata: unknown): PlatformReleaseMetadata | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  if (record.recordType !== PLATFORM_RELEASE_RECORD_TYPE) {
    return null;
  }

  return {
    recordType: PLATFORM_RELEASE_RECORD_TYPE,
    version: String(record.version ?? "0.0.0"),
    releaseNotes: String(record.releaseNotes ?? ""),
    environment: String(record.environment ?? "production"),
    rolloutStatus: String(record.rolloutStatus ?? "SCHEDULED"),
    scheduledAt: record.scheduledAt ? String(record.scheduledAt) : null,
    deployedAt: record.deployedAt ? String(record.deployedAt) : null,
    rollbackOf: record.rollbackOf ? String(record.rollbackOf) : null,
    createdBy: record.createdBy ? String(record.createdBy) : null,
  };
}

export function serializePlatformReleaseMetadata(
  input: Omit<PlatformReleaseMetadata, "recordType">,
): Prisma.InputJsonValue {
  return {
    recordType: PLATFORM_RELEASE_RECORD_TYPE,
    ...input,
  };
}

export function serializeReleaseRecord(record: BackupRecord): ControlCenterReleaseItem | null {
  const metadata = parsePlatformReleaseMetadata(record.metadata);
  if (!metadata) {
    return null;
  }

  return {
    id: record.id,
    version: metadata.version,
    releaseNotes: metadata.releaseNotes,
    environment: metadata.environment,
    rolloutStatus: metadata.rolloutStatus,
    scheduledAt: metadata.scheduledAt ?? null,
    deployedAt: metadata.deployedAt ?? null,
    rollbackOf: metadata.rollbackOf ?? null,
    createdAt: record.createdAt.toISOString(),
    createdBy: metadata.createdBy ?? null,
  };
}

export function formatStaffName(firstName: string | null, lastName: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Unknown";
}

export function inferAuditCategory(eventType: string): string {
  const normalized = eventType.toLowerCase();

  if (normalized.includes("flag")) {
    return "feature_flag";
  }

  if (normalized.includes("release") || normalized.includes("deploy")) {
    return "release";
  }

  if (
    normalized.includes("login") ||
    normalized.includes("session") ||
    normalized.includes("mfa")
  ) {
    return "security";
  }

  if (normalized.includes("maintenance")) {
    return "maintenance";
  }

  if (
    normalized.includes("config") ||
    normalized.includes("setting") ||
    normalized.includes("updated")
  ) {
    return "configuration";
  }

  return "system";
}
