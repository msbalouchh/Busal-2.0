import type {
  SearchAuditLog,
  SearchIndexJob,
  SearchIndexRecord,
  SearchQueryLog,
  SearchSuggestion,
} from "@prisma/client";

import type {
  SearchAuditLogView,
  SearchIndexJobView,
  SearchIndexRecordView,
  SearchPlatformDashboardMetrics,
  SearchQueryLogView,
  SearchSuggestionView,
} from "@/modules/search-platform/types/search-platform-types";

export function serializeSearchIndexRecord(record: SearchIndexRecord): SearchIndexRecordView {
  return {
    id: record.id,
    entityType: record.entityType,
    entityId: record.entityId,
    title: record.title,
    description: record.description,
    status: record.status,
    branchId: record.branchId,
    lastIndexedAt: record.lastIndexedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
  };
}

export function serializeSearchQueryLog(log: SearchQueryLog): SearchQueryLogView {
  return {
    id: log.id,
    query: log.query,
    matchMode: log.matchMode,
    resultCount: log.resultCount,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeSearchIndexJob(job: SearchIndexJob): SearchIndexJobView {
  return {
    id: job.id,
    jobType: job.jobType,
    status: job.status,
    entityType: job.entityType,
    entityId: job.entityId,
    errorMessage: job.errorMessage,
    queuedAt: job.queuedAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

export function serializeSearchAuditLog(log: SearchAuditLog): SearchAuditLogView {
  return {
    id: log.id,
    eventType: log.eventType,
    metadata: (log.metadata as Record<string, unknown> | null) ?? null,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeSearchSuggestion(suggestion: SearchSuggestion): SearchSuggestionView {
  return {
    id: suggestion.id,
    suggestionType: suggestion.suggestionType,
    query: suggestion.query,
    hitCount: suggestion.hitCount,
    lastUsedAt: suggestion.lastUsedAt.toISOString(),
  };
}

export function serializeSearchPlatformDashboard(
  metrics: SearchPlatformDashboardMetrics,
): SearchPlatformDashboardMetrics {
  return metrics;
}

export type SearchPlatformDashboardView = SearchPlatformDashboardMetrics;

export type SearchEntityRegistrationView = {
  entityType: string;
  label: string;
  module: string;
  requiredPermission: string;
};
