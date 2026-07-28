import type { KnowledgeSourceType } from "@prisma/client";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type {
  KnowledgeCitation,
  KnowledgeRetrievalOptions,
  KnowledgeRetrievalResult,
} from "@/modules/ai-knowledge/types/knowledge-types";
import {
  averageScore,
  semanticVectorSearch,
  type VectorSearchCandidate,
} from "@/modules/ai-knowledge/engine/vector-search";

export interface RetrievalDependencies {
  loadCandidates: (input: {
    businessId: string;
    branchId: string | null;
    collectionIds?: string[];
    module?: string | null;
    language?: string | null;
    sourceTypes?: KnowledgeSourceType[];
  }) => Promise<VectorSearchCandidate[]>;
  writeAudit: (input: {
    businessId: string;
    branchId: string | null;
    userId: string | null;
    staffId: string | null;
    agentId: string | null;
    query: string;
    collectionIds: string[];
    citations: KnowledgeCitation[];
    confidenceScore: number;
  }) => Promise<{ id: string }>;
}

function buildKnowledgeContext(citations: KnowledgeCitation[]): string {
  if (citations.length === 0) {
    return "";
  }

  return citations
    .map(
      (citation, index) =>
        `[${index + 1}] ${citation.documentTitle} (v${citation.versionNumber}, ${citation.sourceType})\n${citation.content}`,
    )
    .join("\n\n");
}

function toCitations(
  results: Awaited<ReturnType<typeof semanticVectorSearch>>,
): KnowledgeCitation[] {
  return results.map((result) => ({
    chunkId: result.id,
    documentId: result.documentId,
    documentTitle: result.documentTitle,
    versionNumber: result.versionNumber,
    sourceType: result.sourceType as KnowledgeSourceType,
    collectionId: result.collectionId,
    collectionName: result.collectionName,
    content: result.content,
    score: result.score,
    metadata: result.metadata,
  }));
}

export async function retrieveKnowledgeThroughEngine(
  platform: BusinessContext,
  query: string,
  options: KnowledgeRetrievalOptions,
  dependencies: RetrievalDependencies,
): Promise<KnowledgeRetrievalResult> {
  const branchId = options.branchId ?? platform.branchId;
  const candidates = await dependencies.loadCandidates({
    businessId: platform.business.id,
    branchId,
    collectionIds: options.collectionIds,
    module: options.module ?? null,
    language: options.language ?? null,
    sourceTypes: options.sourceTypes,
  });

  const ranked = await semanticVectorSearch(query, candidates, {
    limit: options.limit ?? 5,
    minScore: options.minScore ?? 0.05,
  });

  const citations = toCitations(ranked);
  const confidenceScore = averageScore(ranked);
  const audit = await dependencies.writeAudit({
    businessId: platform.business.id,
    branchId,
    userId: platform.user.id,
    staffId: platform.staffSession?.staffId ?? null,
    agentId: options.agentId ?? null,
    query,
    collectionIds: options.collectionIds ?? [],
    citations,
    confidenceScore,
  });

  return {
    query,
    citations,
    context: buildKnowledgeContext(citations),
    confidenceScore,
    auditId: audit.id,
  };
}
