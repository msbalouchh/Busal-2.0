export interface MemoryEmbeddingRequest {
  memoryId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryEmbeddingResult {
  reference: string;
  dimensions?: number;
  provider?: string;
}

export interface SemanticSearchRequest {
  businessId: string;
  query: string;
  limit?: number;
  memoryTypes?: string[];
}

export interface SemanticSearchResult {
  memoryId: string;
  score: number;
  reference: string;
}

export interface IMemoryEmbeddingProvider {
  readonly providerName: string;
  generateEmbedding(request: MemoryEmbeddingRequest): Promise<MemoryEmbeddingResult>;
  semanticSearch?(request: SemanticSearchRequest): Promise<SemanticSearchResult[]>;
}
