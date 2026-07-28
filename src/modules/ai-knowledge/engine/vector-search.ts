import { createEmbedding, parseEmbedding } from "@/modules/ai-knowledge/engine/embedding-client";

export interface VectorSearchCandidate {
  id: string;
  content: string;
  embedding: unknown;
  metadata?: Record<string, unknown> | null;
  documentId: string;
  documentTitle: string;
  versionNumber: number;
  collectionId: string;
  collectionName: string;
  sourceType: string;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, unknown> | null;
  documentId: string;
  documentTitle: string;
  versionNumber: number;
  collectionId: string;
  collectionName: string;
  sourceType: string;
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index]! * right[index]!;
    leftMagnitude += left[index]! * left[index]!;
    rightMagnitude += right[index]! * right[index]!;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

export async function semanticVectorSearch(
  query: string,
  candidates: VectorSearchCandidate[],
  options: {
    limit?: number;
    minScore?: number;
  } = {},
): Promise<VectorSearchResult[]> {
  const queryEmbedding = await createEmbedding(query);
  const limit = options.limit ?? 5;
  const minScore = options.minScore ?? 0.05;

  return candidates
    .map((candidate) => ({
      id: candidate.id,
      content: candidate.content,
      score: cosineSimilarity(queryEmbedding, parseEmbedding(candidate.embedding)),
      metadata: candidate.metadata ?? null,
      documentId: candidate.documentId,
      documentTitle: candidate.documentTitle,
      versionNumber: candidate.versionNumber,
      collectionId: candidate.collectionId,
      collectionName: candidate.collectionName,
      sourceType: candidate.sourceType,
    }))
    .filter((result) => result.score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function averageScore(results: VectorSearchResult[]): number {
  if (results.length === 0) {
    return 0;
  }

  return results.reduce((sum, result) => sum + result.score, 0) / results.length;
}
