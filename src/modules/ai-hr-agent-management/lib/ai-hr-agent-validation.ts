import type { HRPriority, HRRecommendationStatus } from "@prisma/client";

import type {
  HrInsightListQuery,
  HrInsightRecord,
  HrRecommendationListQuery,
  HrRecommendationRecord,
} from "@/modules/ai-hr-agent-management/types/ai-hr-agent-types";

export function serializeHrInsight(insight: {
  id: string;
  businessId: string;
  staffId: string | null;
  title: string;
  description: string | null;
  category: string;
  priority: HRPriority;
  recommendation: string | null;
  status: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  staff?: { id: string; fullName: string } | null;
}): HrInsightRecord {
  return {
    id: insight.id,
    businessId: insight.businessId,
    staffId: insight.staffId,
    staffName: insight.staff?.fullName ?? null,
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

export function serializeHrRecommendation(recommendation: {
  id: string;
  businessId: string;
  staffId: string | null;
  title: string;
  description: string | null;
  action: string;
  confidenceScore: number | null;
  status: HRRecommendationStatus;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  staff?: { id: string; fullName: string } | null;
}): HrRecommendationRecord {
  return {
    id: recommendation.id,
    businessId: recommendation.businessId,
    staffId: recommendation.staffId,
    staffName: recommendation.staff?.fullName ?? null,
    title: recommendation.title,
    description: recommendation.description,
    action: recommendation.action,
    confidenceScore: recommendation.confidenceScore,
    status: recommendation.status,
    metadata: (recommendation.metadata as Record<string, unknown>) ?? {},
    createdAt: recommendation.createdAt.toISOString(),
    updatedAt: recommendation.updatedAt.toISOString(),
  };
}

export function validateHrInsightListQuery(query: HrInsightListQuery): HrInsightListQuery {
  return {
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(100, Math.max(1, query.pageSize ?? 20)),
    search: query.search?.trim() || undefined,
    priority: query.priority ?? "ALL",
    category: query.category && query.category !== "ALL" ? query.category : undefined,
    status: query.status ?? "ALL",
    staffId: query.staffId || undefined,
  };
}

export function validateHrRecommendationListQuery(
  query: HrRecommendationListQuery,
): HrRecommendationListQuery {
  return {
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(100, Math.max(1, query.pageSize ?? 20)),
    search: query.search?.trim() || undefined,
    status: query.status ?? "ALL",
    staffId: query.staffId || undefined,
  };
}

export function validateHrRecommendationStatusUpdate(status: string): HRRecommendationStatus {
  const allowed: HRRecommendationStatus[] = ["VIEWED", "IMPLEMENTED", "DISMISSED"];
  if (!allowed.includes(status as HRRecommendationStatus)) {
    throw new Error("Invalid recommendation status");
  }
  return status as HRRecommendationStatus;
}

export function formatConfidence(score: number | null): string {
  if (score === null) return "—";
  return `${Math.round(score * 100)}%`;
}
