import type { SearchEntityType, SearchIndexJobType } from "@prisma/client";

import type { IndexSearchRecordInput } from "@/modules/search-platform/types/search-platform-types";
import { buildSearchableText } from "@/modules/search-platform/engine/search-engine";
import { getRequiredPermissionForEntity } from "@/modules/search-platform/registry/search-registry";

export interface PreparedIndexRecord {
  entityType: SearchEntityType;
  entityId: string;
  title: string;
  description: string;
  searchableText: string;
  searchableFields: Record<string, string>;
  metadata: Record<string, unknown> | null;
  requiredPermission: string | null;
  branchId: string | null;
}

export function prepareIndexRecord(input: IndexSearchRecordInput): PreparedIndexRecord {
  const searchableFields = input.searchableFields ?? {};
  const requiredPermission =
    input.requiredPermission ?? getRequiredPermissionForEntity(input.entityType);

  return {
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title,
    description: input.description ?? "",
    searchableText: buildSearchableText({
      title: input.title,
      description: input.description,
      searchableFields,
    }),
    searchableFields,
    metadata: input.metadata ?? null,
    requiredPermission,
    branchId: input.branchId ?? null,
  };
}

export function shouldReindexRecord(
  existingUpdatedAt: Date | null,
  sourceUpdatedAt: Date,
): boolean {
  if (!existingUpdatedAt) {
    return true;
  }

  return sourceUpdatedAt.getTime() > existingUpdatedAt.getTime();
}

export function resolveIndexJobScope(
  jobType: SearchIndexJobType,
): "incremental" | "full" | "entity" {
  switch (jobType) {
    case "FULL_REBUILD":
      return "full";
    case "REINDEX_ENTITY":
      return "entity";
    default:
      return "incremental";
  }
}

export function buildIndexJobLabel(
  jobType: SearchIndexJobType,
  entityType?: SearchEntityType | null,
): string {
  if (jobType === "FULL_REBUILD") {
    return "Full index rebuild";
  }

  if (jobType === "REINDEX_ENTITY" && entityType) {
    return `Reindex ${entityType}`;
  }

  return "Incremental index update";
}
