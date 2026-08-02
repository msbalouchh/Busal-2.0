import type { FinancePriority, FinanceRecommendationStatus } from "@prisma/client";

import type {
  FinanceInsightListQuery,
  FinanceInsightRecord,
  FinanceRecommendationListQuery,
  FinanceRecommendationRecord,
} from "@/modules/ai-finance-agent-management/types/ai-finance-agent-types";

export function serializeFinanceInsight(insight: {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  category: string;
  priority: FinancePriority;
  recommendation: string | null;
  status: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): FinanceInsightRecord {
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

export function serializeFinanceRecommendation(recommendation: {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  action: string;
  expectedImpact: string | null;
  confidenceScore: number | null;
  status: FinanceRecommendationStatus;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): FinanceRecommendationRecord {
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

export function validateFinanceInsightListQuery(
  query: FinanceInsightListQuery,
): FinanceInsightListQuery {
  return {
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(100, Math.max(1, query.pageSize ?? 20)),
    search: query.search?.trim() || undefined,
    priority: query.priority ?? "ALL",
    category: query.category && query.category !== "ALL" ? query.category : undefined,
    status: query.status ?? "ALL",
  };
}

export function validateFinanceRecommendationListQuery(
  query: FinanceRecommendationListQuery,
): FinanceRecommendationListQuery {
  return {
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(100, Math.max(1, query.pageSize ?? 20)),
    search: query.search?.trim() || undefined,
    status: query.status ?? "ALL",
  };
}

export function validateFinanceRecommendationStatusUpdate(
  status: string,
): FinanceRecommendationStatus {
  const allowed: FinanceRecommendationStatus[] = ["VIEWED", "IMPLEMENTED", "DISMISSED"];
  if (!allowed.includes(status as FinanceRecommendationStatus)) {
    throw new Error("Invalid recommendation status");
  }
  return status as FinanceRecommendationStatus;
}

export function formatConfidence(score: number | null): string {
  if (score === null) return "—";
  return `${Math.round(score * 100)}%`;
}

export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
