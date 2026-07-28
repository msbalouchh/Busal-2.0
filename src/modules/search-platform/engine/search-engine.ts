import type { SearchEntityType, SearchMatchMode } from "@prisma/client";

import { DEFAULT_SEARCH_PAGE_SIZE } from "@/modules/search-platform/constants/routes";
import type {
  GlobalSearchGroup,
  GlobalSearchOptions,
  GlobalSearchResponse,
  GlobalSearchResultItem,
  SearchFacetResult,
  SearchHighlight,
} from "@/modules/search-platform/types/search-platform-types";
import { getSearchableEntity } from "@/modules/search-platform/registry/search-registry";

export interface SearchIndexRecordCandidate {
  id: string;
  businessId: string;
  branchId: string | null;
  entityType: SearchEntityType;
  entityId: string;
  title: string;
  description: string;
  searchableText: string;
  metadata: Record<string, unknown> | null;
  lastIndexedAt: Date | null;
  requiredPermission?: string | null;
  businessName?: string;
  branchName?: string;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function tokenize(text: string): string[] {
  return normalizeQuery(text)
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i += 1) {
    matrix[i] = [i];
    for (let j = 1; j <= b.length; j += 1) {
      if (i === 0) {
        matrix[i]![j] = j;
        continue;
      }

      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost,
      );
    }
  }

  return matrix[a.length]![b.length]!;
}

function isFuzzyMatch(token: string, target: string): boolean {
  if (target.includes(token)) {
    return true;
  }

  if (token.length < 3) {
    return false;
  }

  const words = target.split(/\s+/);
  return words.some((word) => {
    if (word.length === 0) {
      return false;
    }

    const distance = levenshteinDistance(token, word);
    const threshold = Math.max(1, Math.floor(word.length / 3));
    return distance <= threshold;
  });
}

function scoreRecord(
  record: SearchIndexRecordCandidate,
  query: string,
  matchMode: SearchMatchMode,
): number {
  const normalizedQuery = normalizeQuery(query);
  const haystack = normalizeQuery(record.searchableText);
  const title = normalizeQuery(record.title);

  if (!normalizedQuery) {
    return 0;
  }

  if (matchMode === "EXACT") {
    return haystack === normalizedQuery || title === normalizedQuery ? 100 : 0;
  }

  if (matchMode === "PREFIX") {
    if (title.startsWith(normalizedQuery)) {
      return 90;
    }

    const words = haystack.split(/\s+/);
    if (words.some((word) => word.startsWith(normalizedQuery))) {
      return 75;
    }

    return 0;
  }

  if (matchMode === "FUZZY") {
    const tokens = tokenize(normalizedQuery);
    const matchedTokens = tokens.filter((token) => isFuzzyMatch(token, haystack));
    if (matchedTokens.length === 0) {
      return 0;
    }

    return (matchedTokens.length / tokens.length) * 80;
  }

  const tokens = tokenize(normalizedQuery);
  let score = 0;

  for (const token of tokens) {
    if (title.includes(token)) {
      score += 30;
    }

    if (haystack.includes(token)) {
      score += 20;
    }
  }

  if (haystack.includes(normalizedQuery)) {
    score += 25;
  }

  return score;
}

function buildHighlights(record: SearchIndexRecordCandidate, query: string): SearchHighlight[] {
  const normalizedQuery = normalizeQuery(query);
  const highlights: SearchHighlight[] = [];

  if (!normalizedQuery) {
    return highlights;
  }

  const highlightField = (field: string, value: string): void => {
    const lowerValue = value.toLowerCase();
    const index = lowerValue.indexOf(normalizedQuery);

    if (index >= 0) {
      const start = Math.max(0, index - 20);
      const end = Math.min(value.length, index + normalizedQuery.length + 20);
      const snippet = value.slice(start, end);
      highlights.push({ field, snippet });
    }
  };

  highlightField("title", record.title);
  highlightField("description", record.description);

  if (highlights.length === 0 && record.searchableText) {
    highlightField("searchableText", record.searchableText.slice(0, 120));
  }

  return highlights;
}

function sortResults(
  results: GlobalSearchResultItem[],
  sortBy: GlobalSearchOptions["sortBy"],
  sortOrder: GlobalSearchOptions["sortOrder"],
): GlobalSearchResultItem[] {
  const order = sortOrder ?? "desc";

  return [...results].sort((a, b) => {
    if (sortBy === "title") {
      return order === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
    }

    if (sortBy === "lastIndexedAt") {
      const aTime = a.metadata?.lastIndexedAt ? String(a.metadata.lastIndexedAt) : "";
      const bTime = b.metadata?.lastIndexedAt ? String(b.metadata.lastIndexedAt) : "";
      return order === "asc" ? aTime.localeCompare(bTime) : bTime.localeCompare(aTime);
    }

    return order === "asc" ? a.score - b.score : b.score - a.score;
  });
}

export function buildSearchFacets(records: SearchIndexRecordCandidate[]): SearchFacetResult[] {
  const entityTypeCounts = new Map<string, number>();
  const branchCounts = new Map<string, number>();

  for (const record of records) {
    entityTypeCounts.set(record.entityType, (entityTypeCounts.get(record.entityType) ?? 0) + 1);

    if (record.branchId) {
      branchCounts.set(record.branchId, (branchCounts.get(record.branchId) ?? 0) + 1);
    }
  }

  return [
    {
      field: "entityType",
      values: Array.from(entityTypeCounts.entries()).map(([value, count]) => ({ value, count })),
    },
    {
      field: "branchId",
      values: Array.from(branchCounts.entries()).map(([value, count]) => ({ value, count })),
    },
  ];
}

export function executeSearchEngine(
  records: SearchIndexRecordCandidate[],
  options: GlobalSearchOptions,
): GlobalSearchResponse {
  const matchMode = options.matchMode ?? "FULL_TEXT";
  const page = Math.max(1, options.page ?? 1);
  const pageSize = options.pageSize ?? DEFAULT_SEARCH_PAGE_SIZE;
  const sortBy = options.sortBy ?? "relevance";
  const sortOrder = options.sortOrder ?? "desc";

  let filtered = records.filter((record) => record.searchableText.length >= 0);

  if (options.entityTypes?.length) {
    filtered = filtered.filter((record) => options.entityTypes!.includes(record.entityType));
  }

  if (options.branchId) {
    filtered = filtered.filter((record) => record.branchId === options.branchId);
  }

  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      filtered = filtered.filter((record) => {
        const metadataValue = record.metadata?.[key];
        return metadataValue !== undefined && String(metadataValue) === value;
      });
    }
  }

  const scored: GlobalSearchResultItem[] = filtered
    .map((record) => {
      const score = scoreRecord(record, options.query, matchMode);
      return {
        id: record.id,
        entityType: record.entityType,
        entityId: record.entityId,
        title: record.title,
        description: record.description,
        businessId: record.businessId,
        branchId: record.branchId,
        businessName: record.businessName,
        branchName: record.branchName,
        score,
        highlights: buildHighlights(record, options.query),
        metadata: record.metadata,
      };
    })
    .filter((result) => result.score > 0 || !options.query.trim());

  const sorted = sortResults(scored, sortBy, sortOrder);
  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const offset = (page - 1) * pageSize;
  const paginated = sorted.slice(offset, offset + pageSize);

  const groupMap = new Map<SearchEntityType, GlobalSearchGroup>();

  for (const result of paginated) {
    const existing = groupMap.get(result.entityType);
    const label = getSearchableEntity(result.entityType)?.label ?? result.entityType;

    if (existing) {
      existing.results.push(result);
      existing.count += 1;
    } else {
      groupMap.set(result.entityType, {
        entityType: result.entityType,
        label,
        count: 1,
        results: [result],
      });
    }
  }

  const facets = options.includeFacets ? buildSearchFacets(filtered) : undefined;

  return {
    query: options.query,
    matchMode,
    totalCount,
    page,
    pageSize,
    totalPages,
    groups: Array.from(groupMap.values()),
    facets,
  };
}

export function buildSearchableText(input: {
  title: string;
  description?: string;
  searchableFields?: Record<string, string>;
}): string {
  const parts = [input.title, input.description ?? ""];

  if (input.searchableFields) {
    parts.push(...Object.values(input.searchableFields));
  }

  return parts.filter(Boolean).join(" ").trim();
}

export function matchesSearchQuery(
  text: string,
  query: string,
  matchMode: SearchMatchMode,
): boolean {
  const record: SearchIndexRecordCandidate = {
    id: "test",
    businessId: "test",
    branchId: null,
    entityType: "CUSTOMER",
    entityId: "test",
    title: text,
    description: "",
    searchableText: text,
    metadata: null,
    lastIndexedAt: null,
  };

  return scoreRecord(record, query, matchMode) > 0;
}
