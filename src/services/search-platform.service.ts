import "server-only";

import type {
  Prisma,
  SearchAuditEventType,
  SearchEntityType,
  SearchSuggestionType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import { getAiSearchArchitectureStatus } from "@/modules/search-platform/engine/ai-search-engine";
import { prepareIndexRecord } from "@/modules/search-platform/engine/index-engine";
import { filterSearchRecordsByPermission } from "@/modules/search-platform/engine/permission-engine";
import {
  executeSearchEngine,
  type SearchIndexRecordCandidate,
} from "@/modules/search-platform/engine/search-engine";
import {
  buildAutocompleteSuggestions,
  rankRecentSuggestions,
  rankTrendingSuggestions,
} from "@/modules/search-platform/engine/suggestion-engine";
import { ensureBootstrapSearchPlatform } from "@/modules/search-platform/plugins/bootstrap-search";
import { listSearchableEntities } from "@/modules/search-platform/registry/search-registry";
import type {
  GlobalSearchOptions,
  GlobalSearchResponse,
  IndexSearchRecordInput,
  QueueSearchIndexJobInput,
  SearchPlatformDashboardMetrics,
  SearchSuggestionsResponse,
} from "@/modules/search-platform/types/search-platform-types";

function assertPermission(platform: BusinessContext, permission: string): void {
  const context = toPermissionEvaluationContext({
    permissions: platform.permissions,
    roleSlug: platform.roleSlug,
    isOwner: platform.isOwner,
    businessId: platform.business.id,
    branchId: platform.branchId,
  });

  if (!evaluatePermission(context, permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

async function logSearchAudit(input: {
  businessId: string;
  eventType: SearchAuditEventType;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.searchAuditLog.create({
    data: {
      businessId: input.businessId,
      userId: input.userId ?? null,
      eventType: input.eventType,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

async function upsertSuggestion(input: {
  businessId: string;
  userId?: string | null;
  suggestionType: SearchSuggestionType;
  query: string;
}): Promise<void> {
  const normalizedQuery = input.query.trim();
  if (!normalizedQuery) {
    return;
  }

  const existing = await prisma.searchSuggestion.findFirst({
    where: {
      businessId: input.businessId,
      userId: input.userId ?? null,
      suggestionType: input.suggestionType,
      query: normalizedQuery,
    },
  });

  if (existing) {
    await prisma.searchSuggestion.update({
      where: { id: existing.id },
      data: {
        hitCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
    return;
  }

  await prisma.searchSuggestion.create({
    data: {
      businessId: input.businessId,
      userId: input.userId ?? null,
      suggestionType: input.suggestionType,
      query: normalizedQuery,
    },
  });
}

async function loadSearchCandidates(businessId: string): Promise<SearchIndexRecordCandidate[]> {
  const records = await prisma.searchIndexRecord.findMany({
    where: { businessId, status: "INDEXED" },
  });

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { businessName: true },
  });

  return records.map((record) => ({
    id: record.id,
    businessId: record.businessId,
    branchId: record.branchId,
    entityType: record.entityType,
    entityId: record.entityId,
    title: record.title,
    description: record.description,
    searchableText: record.searchableText,
    metadata: (record.metadata as Record<string, unknown> | null) ?? null,
    lastIndexedAt: record.lastIndexedAt,
    requiredPermission: record.requiredPermission,
    businessName: business?.businessName ?? undefined,
    branchName: record.branchId ?? undefined,
  }));
}

export async function ensureSearchPlatformDefaults(businessId: string): Promise<void> {
  ensureBootstrapSearchPlatform();

  const existing = await prisma.searchAiConfig.findUnique({
    where: { businessId },
  });

  if (!existing) {
    await prisma.searchAiConfig.create({
      data: {
        businessId,
        config: {
          architecture: "prepared",
          vectorStore: "pending",
          embeddingModel: "pending",
        },
      },
    });
  }
}

export async function indexSearchRecord(
  businessId: string,
  input: IndexSearchRecordInput,
): Promise<{ id: string }> {
  ensureBootstrapSearchPlatform();
  const prepared = prepareIndexRecord(input);

  const record = await prisma.searchIndexRecord.upsert({
    where: {
      businessId_entityType_entityId: {
        businessId,
        entityType: prepared.entityType,
        entityId: prepared.entityId,
      },
    },
    create: {
      businessId,
      branchId: prepared.branchId,
      entityType: prepared.entityType,
      entityId: prepared.entityId,
      title: prepared.title,
      description: prepared.description,
      searchableText: prepared.searchableText,
      searchableFields: prepared.searchableFields as Prisma.InputJsonValue,
      metadata: prepared.metadata ? (prepared.metadata as Prisma.InputJsonValue) : undefined,
      requiredPermission: prepared.requiredPermission,
      status: "INDEXED",
      lastIndexedAt: new Date(),
    },
    update: {
      branchId: prepared.branchId,
      title: prepared.title,
      description: prepared.description,
      searchableText: prepared.searchableText,
      searchableFields: prepared.searchableFields as Prisma.InputJsonValue,
      metadata: prepared.metadata ? (prepared.metadata as Prisma.InputJsonValue) : undefined,
      requiredPermission: prepared.requiredPermission,
      status: "INDEXED",
      lastIndexedAt: new Date(),
    },
  });

  return { id: record.id };
}

export async function bulkIndexSearchRecords(
  businessId: string,
  inputs: IndexSearchRecordInput[],
): Promise<{ indexed: number }> {
  let indexed = 0;

  for (const input of inputs) {
    await indexSearchRecord(businessId, input);
    indexed += 1;
  }

  return { indexed };
}

export async function removeSearchIndex(
  businessId: string,
  entityType: SearchEntityType,
  entityId: string,
): Promise<void> {
  await prisma.searchIndexRecord.deleteMany({
    where: { businessId, entityType, entityId },
  });
}

export async function queueSearchIndexJob(
  platform: BusinessContext,
  input: QueueSearchIndexJobInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.SEARCH_MANAGE_INDEX);

  const job = await prisma.searchIndexJob.create({
    data: {
      businessId: platform.business.id,
      jobType: input.jobType,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  return { id: job.id };
}

export async function processSearchIndexJob(jobId: string): Promise<{ processed: number }> {
  const job = await prisma.searchIndexJob.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new Error("Search index job not found");
  }

  await prisma.searchIndexJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING", startedAt: new Date() },
  });

  try {
    let processed = 0;

    if (job.jobType === "FULL_REBUILD") {
      await prisma.searchIndexRecord.updateMany({
        where: { businessId: job.businessId },
        data: { status: "STALE" },
      });

      const staleRecords = await prisma.searchIndexRecord.findMany({
        where: { businessId: job.businessId, status: "STALE" },
      });

      for (const record of staleRecords) {
        await prisma.searchIndexRecord.update({
          where: { id: record.id },
          data: { status: "INDEXED", lastIndexedAt: new Date() },
        });
        processed += 1;
      }

      await logSearchAudit({
        businessId: job.businessId,
        eventType: "FULL_REBUILD",
        metadata: { jobId, processed },
      });
    } else if (job.jobType === "REINDEX_ENTITY" && job.entityType && job.entityId) {
      const record = await prisma.searchIndexRecord.findFirst({
        where: {
          businessId: job.businessId,
          entityType: job.entityType,
          entityId: job.entityId,
        },
      });

      if (record) {
        await prisma.searchIndexRecord.update({
          where: { id: record.id },
          data: { status: "INDEXED", lastIndexedAt: new Date() },
        });
        processed = 1;
      }

      await logSearchAudit({
        businessId: job.businessId,
        eventType: "REINDEX",
        metadata: { jobId, entityType: job.entityType, entityId: job.entityId },
      });
    } else {
      const queuedRecords = await prisma.searchIndexRecord.findMany({
        where: { businessId: job.businessId, status: { in: ["QUEUED", "FAILED"] } },
        take: 100,
      });

      for (const record of queuedRecords) {
        await prisma.searchIndexRecord.update({
          where: { id: record.id },
          data: { status: "INDEXED", lastIndexedAt: new Date() },
        });
        processed += 1;
      }

      await logSearchAudit({
        businessId: job.businessId,
        eventType: "INCREMENTAL_INDEX",
        metadata: { jobId, processed },
      });
    }

    await prisma.searchIndexJob.update({
      where: { id: jobId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    return { processed };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown indexing error";

    await prisma.searchIndexJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorMessage: message, completedAt: new Date() },
    });

    await logSearchAudit({
      businessId: job.businessId,
      eventType: "INDEX_FAILED",
      metadata: { jobId, error: message },
    });

    throw error;
  }
}

export async function executeGlobalSearch(
  platform: BusinessContext,
  options: GlobalSearchOptions,
): Promise<GlobalSearchResponse> {
  assertPermission(platform, PERMISSION_CODES.SEARCH_QUERY);

  const candidates = await loadSearchCandidates(platform.business.id);
  const permitted = filterSearchRecordsByPermission(
    {
      permissions: platform.permissions,
      roleSlug: platform.roleSlug,
      isOwner: platform.isOwner,
      businessId: platform.business.id,
      branchId: platform.branchId,
    },
    candidates,
  );

  const response = executeSearchEngine(permitted, options);

  const queryLog = await prisma.searchQueryLog.create({
    data: {
      businessId: platform.business.id,
      userId: platform.user.id,
      query: options.query,
      matchMode: options.matchMode ?? "FULL_TEXT",
      resultCount: response.totalCount,
      filters: options.filters ? (options.filters as Prisma.InputJsonValue) : undefined,
      facets: response.facets ? (response.facets as unknown as Prisma.InputJsonValue) : undefined,
    },
  });

  await logSearchAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "QUERY",
    metadata: {
      query: options.query,
      resultCount: response.totalCount,
      queryLogId: queryLog.id,
    },
  });

  await upsertSuggestion({
    businessId: platform.business.id,
    userId: platform.user.id,
    suggestionType: "RECENT",
    query: options.query,
  });

  await upsertSuggestion({
    businessId: platform.business.id,
    userId: null,
    suggestionType: "TRENDING",
    query: options.query,
  });

  return { ...response, queryLogId: queryLog.id };
}

export async function getSearchSuggestions(
  platform: BusinessContext,
  prefix?: string,
): Promise<SearchSuggestionsResponse> {
  assertPermission(platform, PERMISSION_CODES.SEARCH_QUERY);

  const [recent, trending] = await Promise.all([
    prisma.searchSuggestion.findMany({
      where: {
        businessId: platform.business.id,
        userId: platform.user.id,
        suggestionType: "RECENT",
      },
      orderBy: { lastUsedAt: "desc" },
      take: 20,
    }),
    prisma.searchSuggestion.findMany({
      where: {
        businessId: platform.business.id,
        suggestionType: "TRENDING",
      },
      orderBy: [{ hitCount: "desc" }, { lastUsedAt: "desc" }],
      take: 20,
    }),
  ]);

  const autocompleteSource = await prisma.searchSuggestion.findMany({
    where: { businessId: platform.business.id, suggestionType: "AUTOCOMPLETE" },
    take: 50,
  });

  const autocomplete = prefix
    ? buildAutocompleteSuggestions(autocompleteSource, prefix)
    : buildAutocompleteSuggestions(trending, prefix ?? "");

  let suggestedResults: GlobalSearchResponse["groups"][number]["results"] = [];

  if (prefix?.trim()) {
    const searchResponse = await executeGlobalSearch(platform, {
      query: prefix,
      matchMode: "PREFIX",
      pageSize: 5,
    });

    suggestedResults = searchResponse.groups.flatMap((group) => group.results);
  }

  return {
    recent: rankRecentSuggestions(recent),
    trending: rankTrendingSuggestions(trending),
    autocomplete,
    suggestedResults,
  };
}

export async function recordSearchClick(
  platform: BusinessContext,
  input: {
    queryLogId?: string;
    indexRecordId: string;
  },
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.SEARCH_QUERY);

  const record = await prisma.searchIndexRecord.findFirst({
    where: { id: input.indexRecordId, businessId: platform.business.id },
  });

  if (!record) {
    throw new Error("Search index record not found");
  }

  await prisma.searchResultClick.create({
    data: {
      businessId: platform.business.id,
      userId: platform.user.id,
      queryLogId: input.queryLogId ?? null,
      indexRecordId: record.id,
      entityType: record.entityType,
      entityId: record.entityId,
    },
  });

  await logSearchAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "RESULT_CLICK",
    metadata: {
      indexRecordId: record.id,
      entityType: record.entityType,
      entityId: record.entityId,
      queryLogId: input.queryLogId,
    },
  });
}

export async function reindexEntity(
  platform: BusinessContext,
  entityType: SearchEntityType,
  entityId: string,
): Promise<{ jobId: string }> {
  assertPermission(platform, PERMISSION_CODES.SEARCH_MANAGE_INDEX);

  const job = await queueSearchIndexJob(platform, {
    jobType: "REINDEX_ENTITY",
    entityType,
    entityId,
  });

  await processSearchIndexJob(job.id);

  return { jobId: job.id };
}

export async function fullRebuildIndex(platform: BusinessContext): Promise<{ jobId: string }> {
  assertPermission(platform, PERMISSION_CODES.SEARCH_MANAGE_INDEX);

  const job = await queueSearchIndexJob(platform, { jobType: "FULL_REBUILD" });
  await processSearchIndexJob(job.id);

  return { jobId: job.id };
}

export async function recoverFailedIndexes(
  platform: BusinessContext,
): Promise<{ recovered: number }> {
  assertPermission(platform, PERMISSION_CODES.SEARCH_MANAGE_INDEX);

  const failed = await prisma.searchIndexRecord.findMany({
    where: { businessId: platform.business.id, status: "FAILED" },
  });

  for (const record of failed) {
    await prisma.searchIndexRecord.update({
      where: { id: record.id },
      data: { status: "QUEUED" },
    });
  }

  const job = await queueSearchIndexJob(platform, { jobType: "INCREMENTAL" });
  const result = await processSearchIndexJob(job.id);

  return { recovered: result.processed };
}

export async function getSearchPlatformDashboard(
  businessId: string,
): Promise<SearchPlatformDashboardMetrics> {
  ensureBootstrapSearchPlatform();

  const [
    totalRecords,
    indexedRecords,
    failedRecords,
    staleRecords,
    queuedJobs,
    totalQueries,
    recentQueries,
    aiConfig,
  ] = await Promise.all([
    prisma.searchIndexRecord.count({ where: { businessId } }),
    prisma.searchIndexRecord.count({ where: { businessId, status: "INDEXED" } }),
    prisma.searchIndexRecord.count({ where: { businessId, status: "FAILED" } }),
    prisma.searchIndexRecord.count({ where: { businessId, status: "STALE" } }),
    prisma.searchIndexJob.count({ where: { businessId, status: "QUEUED" } }),
    prisma.searchQueryLog.count({ where: { businessId } }),
    prisma.searchQueryLog.count({
      where: {
        businessId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.searchAiConfig.findUnique({ where: { businessId } }),
  ]);

  const aiStatus = getAiSearchArchitectureStatus(
    aiConfig
      ? {
          semanticEnabled: aiConfig.semanticEnabled,
          vectorEnabled: aiConfig.vectorEnabled,
          nlEnabled: aiConfig.nlEnabled,
          aiRankingEnabled: aiConfig.aiRankingEnabled,
        }
      : null,
  );

  return {
    totalRecords,
    indexedRecords,
    failedRecords,
    staleRecords,
    queuedJobs,
    totalQueries,
    recentQueries,
    registeredEntityTypes: listSearchableEntities().length,
    aiSearchReady: aiStatus.ready,
  };
}

export async function listSearchIndexRecords(businessId: string) {
  return prisma.searchIndexRecord.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function listSearchQueryLogs(businessId: string) {
  return prisma.searchQueryLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listSearchIndexJobs(businessId: string) {
  return prisma.searchIndexJob.findMany({
    where: { businessId },
    orderBy: { queuedAt: "desc" },
    take: 100,
  });
}

export async function listSearchAuditLogs(businessId: string) {
  return prisma.searchAuditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listSearchSuggestions(businessId: string) {
  return prisma.searchSuggestion.findMany({
    where: { businessId },
    orderBy: { lastUsedAt: "desc" },
    take: 100,
  });
}

export async function listSearchEntityRegistrations() {
  ensureBootstrapSearchPlatform();
  return listSearchableEntities();
}
