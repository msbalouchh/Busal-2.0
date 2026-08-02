import type { Prisma } from "@prisma/client";

export interface MarketplaceItemAdminFlags {
  featured: boolean;
  adminHidden: boolean;
  reviewNotes: string | null;
  securityReviewPassed: boolean;
  compatibilityReviewPassed: boolean;
}

export function parseMarketplaceItemCompatibility(
  compatibility: Prisma.JsonValue | null,
): MarketplaceItemAdminFlags & {
  minBusalVersion?: string;
  requiredModules?: string[];
  requiresAi?: boolean;
} {
  const record =
    compatibility && typeof compatibility === "object" && !Array.isArray(compatibility)
      ? (compatibility as Record<string, unknown>)
      : {};

  return {
    minBusalVersion:
      typeof record.minBusalVersion === "string" ? record.minBusalVersion : undefined,
    requiredModules: Array.isArray(record.requiredModules)
      ? record.requiredModules.filter((value): value is string => typeof value === "string")
      : undefined,
    requiresAi: record.requiresAi === true,
    featured: record.featured === true,
    adminHidden: record.adminHidden === true,
    reviewNotes: typeof record.reviewNotes === "string" ? record.reviewNotes : null,
    securityReviewPassed: record.securityReviewPassed === true,
    compatibilityReviewPassed: record.compatibilityReviewPassed === true,
  };
}

export function mergeMarketplaceItemCompatibility(
  compatibility: Prisma.JsonValue | null,
  patch: Partial<MarketplaceItemAdminFlags & Record<string, unknown>>,
): Prisma.InputJsonValue {
  const current =
    compatibility && typeof compatibility === "object" && !Array.isArray(compatibility)
      ? (compatibility as Record<string, unknown>)
      : {};

  return { ...current, ...patch } as Prisma.InputJsonValue;
}

export function parseLicenseSeatMetadata(metadata: Prisma.JsonValue | null): {
  seatsUsed: number;
  seatsTotal: number;
} {
  const record =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};

  const seatsTotal =
    typeof record.seatsTotal === "number"
      ? record.seatsTotal
      : typeof record.seats === "number"
        ? record.seats
        : 1;

  const seatsUsed = typeof record.seatsUsed === "number" ? record.seatsUsed : 1;

  return { seatsUsed, seatsTotal };
}
