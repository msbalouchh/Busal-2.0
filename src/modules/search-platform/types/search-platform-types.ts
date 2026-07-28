import type {
  SearchEntityType,
  SearchIndexJobStatus,
  SearchIndexJobType,
  SearchIndexStatus,
  SearchMatchMode,
  SearchSuggestionType,
} from "@prisma/client";

export interface SearchableEntityDefinition {
  entityType: SearchEntityType;
  label: string;
  requiredPermission: string;
  defaultFields: string[];
  module: string;
}

export interface IndexSearchRecordInput {
  entityType: SearchEntityType;
  entityId: string;
  title: string;
  description?: string;
  branchId?: string | null;
  searchableFields?: Record<string, string>;
  metadata?: Record<string, unknown>;
  requiredPermission?: string | null;
}

export interface GlobalSearchOptions {
  query: string;
  matchMode?: SearchMatchMode;
  entityTypes?: SearchEntityType[];
  branchId?: string | null;
  filters?: Record<string, string>;
  sortBy?: "relevance" | "title" | "lastIndexedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  includeFacets?: boolean;
}

export interface SearchHighlight {
  field: string;
  snippet: string;
}

export interface GlobalSearchResultItem {
  id: string;
  entityType: SearchEntityType;
  entityId: string;
  title: string;
  description: string;
  businessId: string;
  branchId: string | null;
  businessName?: string;
  branchName?: string;
  score: number;
  highlights: SearchHighlight[];
  metadata?: Record<string, unknown> | null;
}

export interface GlobalSearchGroup {
  entityType: SearchEntityType;
  label: string;
  count: number;
  results: GlobalSearchResultItem[];
}

export interface GlobalSearchResponse {
  query: string;
  matchMode: SearchMatchMode;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  groups: GlobalSearchGroup[];
  facets?: SearchFacetResult[];
  queryLogId?: string;
}

export interface SearchFacetResult {
  field: string;
  values: Array<{ value: string; count: number }>;
}

export interface SearchSuggestionsResponse {
  recent: string[];
  trending: string[];
  autocomplete: string[];
  suggestedResults: GlobalSearchResultItem[];
}

export interface QueueSearchIndexJobInput {
  jobType: SearchIndexJobType;
  entityType?: SearchEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchPlatformDashboardMetrics {
  totalRecords: number;
  indexedRecords: number;
  failedRecords: number;
  staleRecords: number;
  queuedJobs: number;
  totalQueries: number;
  recentQueries: number;
  registeredEntityTypes: number;
  aiSearchReady: boolean;
}

export interface SearchIndexRecordView {
  id: string;
  entityType: SearchEntityType;
  entityId: string;
  title: string;
  description: string;
  status: SearchIndexStatus;
  branchId: string | null;
  lastIndexedAt: string | null;
  createdAt: string;
}

export interface SearchQueryLogView {
  id: string;
  query: string;
  matchMode: SearchMatchMode;
  resultCount: number;
  createdAt: string;
}

export interface SearchIndexJobView {
  id: string;
  jobType: SearchIndexJobType;
  status: SearchIndexJobStatus;
  entityType: SearchEntityType | null;
  entityId: string | null;
  errorMessage: string | null;
  queuedAt: string;
  completedAt: string | null;
}

export interface SearchAuditLogView {
  id: string;
  eventType: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface SearchSuggestionView {
  id: string;
  suggestionType: SearchSuggestionType;
  query: string;
  hitCount: number;
  lastUsedAt: string;
}

export interface AiSearchArchitectureStatus {
  semanticEnabled: boolean;
  vectorEnabled: boolean;
  nlEnabled: boolean;
  aiRankingEnabled: boolean;
  ready: boolean;
  message: string;
}
