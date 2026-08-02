import type { OperationPriority, OperationRecommendationStatus } from "@prisma/client";

import type {
  OperationInsightListQuery,
  OperationInsightRecord,
  OperationRecommendationListQuery,
  OperationRecommendationRecord,
} from "@/modules/ai-operations-agent-management/types/ai-operations-agent-types";

export function serializeOperationInsight(insight: {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  category: string;
  priority: OperationPriority;
  recommendation: string | null;
  status: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): OperationInsightRecord {
  return {
    id: insight.id,
    businessId: insight.businessId,
    title: insight.title,
    description: insight.description,
    category: insight.category,
    priority: insight.priority,
    recommendation: insight.recommendation,
    status: insight.status,
    metadata: (insight.metadata as Record<string, unknown>) ?? {},
    createdAt: insight.createdAt.toISOString(),
    updatedAt: insight.updatedAt.toISOString(),
  };
}

export function serializeOperationRecommendation(recommendation: {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  action: string;
  expectedImpact: string | null;
  confidenceScore: number | null;
  status: OperationRecommendationStatus;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): OperationRecommendationRecord {
  return {
    id: recommendation.id,
    businessId: recommendation.businessId,
    title: recommendation.title,
    description: recommendation.description,
    action: recommendation.action,
    expectedImpact: recommendation.expectedImpact,
    confidenceScore: recommendation.confidenceScore,
    status: recommendation.status,
    metadata: (recommendation.metadata as Record<string, unknown>) ?? {},
    createdAt: recommendation.createdAt.toISOString(),
    updatedAt: recommendation.updatedAt.toISOString(),
  };
}

export function validateOperationInsightListQuery(
  query: OperationInsightListQuery,
): OperationInsightListQuery {
  return {
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(100, Math.max(1, query.pageSize ?? 20)),
    search: query.search?.trim() || undefined,
    priority: query.priority ?? "ALL",
    category: query.category && query.category !== "ALL" ? query.category : undefined,
    status: query.status ?? "ALL",
  };
}

export function validateOperationRecommendationListQuery(
  query: OperationRecommendationListQuery,
): OperationRecommendationListQuery {
  return {
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(100, Math.max(1, query.pageSize ?? 20)),
    search: query.search?.trim() || undefined,
    status: query.status ?? "ALL",
  };
}

export function validateOperationRecommendationStatusUpdate(
  status: string,
): OperationRecommendationStatus {
  const allowed: OperationRecommendationStatus[] = ["VIEWED", "IMPLEMENTED", "DISMISSED"];
  if (!allowed.includes(status as OperationRecommendationStatus)) {
    throw new Error("Invalid recommendation status");
  }
  return status as OperationRecommendationStatus;
}

export function formatConfidence(score: number | null): string {
  if (score === null) return "—";
  return `${Math.round(score * 100)}%`;
}
