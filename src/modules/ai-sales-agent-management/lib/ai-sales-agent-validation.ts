import type { RecommendationStatus, SalesPriority } from "@prisma/client";

import type {
  SalesInsightListQuery,
  SalesInsightRecord,
  SalesRecommendationListQuery,
  SalesRecommendationRecord,
} from "@/modules/ai-sales-agent-management/types/ai-sales-agent-types";

export function serializeSalesInsight(insight: {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  priority: SalesPriority;
  category: string;
  recommendation: string | null;
  status: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): SalesInsightRecord {
  return {
    id: insight.id,
    businessId: insight.businessId,
    title: insight.title,
    description: insight.description,
    priority: insight.priority,
    category: insight.category,
    recommendation: insight.recommendation,
    status: insight.status,
    metadata: (insight.metadata as Record<string, unknown>) ?? {},
    createdAt: insight.createdAt.toISOString(),
    updatedAt: insight.updatedAt.toISOString(),
  };
}

export function serializeSalesRecommendation(recommendation: {
  id: string;
  businessId: string;
  customerId: string | null;
  title: string;
  description: string | null;
  action: string;
  priority: SalesPriority;
  status: RecommendationStatus;
  expectedImpact: string | null;
  metadata: unknown;
  createdAt: Date;
  customer?: { id: string; name: string } | null;
}): SalesRecommendationRecord {
  return {
    id: recommendation.id,
    businessId: recommendation.businessId,
    customerId: recommendation.customerId,
    customerName: recommendation.customer?.name ?? null,
    title: recommendation.title,
    description: recommendation.description,
    action: recommendation.action,
    priority: recommendation.priority,
    status: recommendation.status,
    expectedImpact: recommendation.expectedImpact,
    metadata: (recommendation.metadata as Record<string, unknown>) ?? {},
    createdAt: recommendation.createdAt.toISOString(),
  };
}

export function validateInsightListQuery(query: SalesInsightListQuery): SalesInsightListQuery {
  return {
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(100, Math.max(1, query.pageSize ?? 20)),
    search: query.search?.trim() || undefined,
    category: query.category || undefined,
    priority: query.priority ?? "ALL",
    status: query.status ?? "ALL",
  };
}

export function validateRecommendationListQuery(
  query: SalesRecommendationListQuery,
): SalesRecommendationListQuery {
  return {
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(100, Math.max(1, query.pageSize ?? 20)),
    search: query.search?.trim() || undefined,
    priority: query.priority ?? "ALL",
    status: query.status ?? "ALL",
    customerId: query.customerId || undefined,
  };
}

export function validateRecommendationStatusUpdate(status: string): RecommendationStatus {
  const allowed: RecommendationStatus[] = ["VIEWED", "IMPLEMENTED", "DISMISSED"];
  if (!allowed.includes(status as RecommendationStatus)) {
    throw new Error("Invalid recommendation status");
  }
  return status as RecommendationStatus;
}

export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
