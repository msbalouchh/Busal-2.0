import type { AiSearchArchitectureStatus } from "@/modules/search-platform/types/search-platform-types";

export interface AiSearchConfigInput {
  semanticEnabled?: boolean;
  vectorEnabled?: boolean;
  nlEnabled?: boolean;
  aiRankingEnabled?: boolean;
  config?: Record<string, unknown>;
}

export interface SemanticSearchRequest {
  query: string;
  businessId: string;
  entityTypes?: string[];
  vectorDimensions?: number;
}

export interface SemanticSearchPlan {
  status: "NOT_IMPLEMENTED";
  architecture: "semantic" | "vector" | "natural_language" | "ai_ranking";
  message: string;
  preparedFields: string[];
}

export function getAiSearchArchitectureStatus(
  config: AiSearchConfigInput | null,
): AiSearchArchitectureStatus {
  const semanticEnabled = config?.semanticEnabled ?? false;
  const vectorEnabled = config?.vectorEnabled ?? false;
  const nlEnabled = config?.nlEnabled ?? false;
  const aiRankingEnabled = config?.aiRankingEnabled ?? false;

  return {
    semanticEnabled,
    vectorEnabled,
    nlEnabled,
    aiRankingEnabled,
    ready: semanticEnabled || vectorEnabled || nlEnabled || aiRankingEnabled,
    message:
      "AI search architecture is prepared. Enable features when models and vector stores are integrated.",
  };
}

export function planSemanticSearch(request: SemanticSearchRequest): SemanticSearchPlan {
  return {
    status: "NOT_IMPLEMENTED",
    architecture: "semantic",
    message: `Semantic search planned for business ${request.businessId}. Models not yet integrated.`,
    preparedFields: ["embeddingVector", "semanticScore", "nlIntent"],
  };
}

export function planVectorSearch(request: SemanticSearchRequest): SemanticSearchPlan {
  return {
    status: "NOT_IMPLEMENTED",
    architecture: "vector",
    message: `Vector search planned with ${request.vectorDimensions ?? 1536} dimensions.`,
    preparedFields: ["vectorIndex", "similarityScore"],
  };
}

export function planNaturalLanguageSearch(request: SemanticSearchRequest): SemanticSearchPlan {
  return {
    status: "NOT_IMPLEMENTED",
    architecture: "natural_language",
    message: `Natural language query parsing prepared for: "${request.query}"`,
    preparedFields: ["parsedIntent", "extractedFilters", "rankedEntities"],
  };
}

export function planAiRanking(_request: SemanticSearchRequest): SemanticSearchPlan {
  return {
    status: "NOT_IMPLEMENTED",
    architecture: "ai_ranking",
    message: "AI ranking layer prepared for re-ranking keyword search results.",
    preparedFields: ["aiScore", "personalizationSignals", "clickThroughBoost"],
  };
}
