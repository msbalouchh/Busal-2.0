import type { SearchSuggestionType } from "@prisma/client";

export interface SuggestionCandidate {
  query: string;
  suggestionType: SearchSuggestionType;
  hitCount: number;
  lastUsedAt: Date;
}

export function rankRecentSuggestions(suggestions: SuggestionCandidate[]): string[] {
  return [...suggestions]
    .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime())
    .map((item) => item.query)
    .slice(0, 10);
}

export function rankTrendingSuggestions(suggestions: SuggestionCandidate[]): string[] {
  return [...suggestions]
    .sort((a, b) => b.hitCount - a.hitCount || b.lastUsedAt.getTime() - a.lastUsedAt.getTime())
    .map((item) => item.query)
    .slice(0, 10);
}

export function buildAutocompleteSuggestions(
  suggestions: SuggestionCandidate[],
  prefix: string,
): string[] {
  const normalizedPrefix = prefix.trim().toLowerCase();

  if (!normalizedPrefix) {
    return [];
  }

  return [...suggestions]
    .filter((item) => item.query.toLowerCase().startsWith(normalizedPrefix))
    .sort((a, b) => b.hitCount - a.hitCount)
    .map((item) => item.query)
    .slice(0, 8);
}

export function mergeSuggestionQueries(existing: string[], incoming: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const query of [...existing, ...incoming]) {
    const normalized = query.trim();
    if (!normalized || seen.has(normalized.toLowerCase())) {
      continue;
    }

    seen.add(normalized.toLowerCase());
    merged.push(normalized);
  }

  return merged;
}
