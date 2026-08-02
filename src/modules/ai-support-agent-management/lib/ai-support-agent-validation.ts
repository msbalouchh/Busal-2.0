import type { SupportPriority, SupportRecommendationStatus } from "@prisma/client";

import type {
  SupportInsightListQuery,
  SupportInsightRecord,
  SupportRecommendationListQuery,
  SupportRecommendationRecord,
} from "@/modules/ai-support-agent-management/types/ai-support-agent-types";

export function serializeSupportInsight(insight: {
  id: string;
  businessId: string;
  customerId: string | null;
  ticketId: string | null;
  title: string;
  description: string | null;
  priority: SupportPriority;
  recommendation: string | null;
  status: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  customer?: { id: string; name: string } | null;
}): SupportInsightRecord {
  return {
    id: insight.id,
    businessId: insight.businessId,
    customerId: insight.customerId,
    customerName: insight.customer?.name ?? null,
    ticketId: insight.ticketId,
    title: insight.title,
    description: insight.description,
    priority: insight.priority,
    recommendation: insight.recommendation,
    status: insight.status,
    metadata: (insight.metadata as Record<string, unknown>) ?? {},
    createdAt: insight.createdAt.toISOString(),
    updatedAt: insight.updatedAt.toISOString(),
  };
}

export function serializeSupportRecommendation(recommendation: {
  id: string;
  businessId: string;
  ticketId: string | null;
  customerId: string | null;
  title: string;
  description: string | null;
  action: string;
  confidenceScore: number | null;
  status: SupportRecommendationStatus;
  metadata: unknown;
  createdAt: Date;
  customer?: { id: string; name: string } | null;
}): SupportRecommendationRecord {
  return {
    id: recommendation.id,
    businessId: recommendation.businessId,
    ticketId: recommendation.ticketId,
    customerId: recommendation.customerId,
    customerName: recommendation.customer?.name ?? null,
    title: recommendation.title,
    description: recommendation.description,
    action: recommendation.action,
    confidenceScore: recommendation.confidenceScore,
    status: recommendation.status,
    metadata: (recommendation.metadata as Record<string, unknown>) ?? {},
    createdAt: recommendation.createdAt.toISOString(),
  };
}

export function validateSupportInsightListQuery(
  query: SupportInsightListQuery,
): SupportInsightListQuery {
  return {
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(100, Math.max(1, query.pageSize ?? 20)),
    search: query.search?.trim() || undefined,
    priority: query.priority ?? "ALL",
    status: query.status ?? "ALL",
    ticketId: query.ticketId || undefined,
    customerId: query.customerId || undefined,
  };
}

export function validateSupportRecommendationListQuery(
  query: SupportRecommendationListQuery,
): SupportRecommendationListQuery {
  return {
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(100, Math.max(1, query.pageSize ?? 20)),
    search: query.search?.trim() || undefined,
    status: query.status ?? "ALL",
    ticketId: query.ticketId || undefined,
    customerId: query.customerId || undefined,
  };
}

export function validateSupportRecommendationStatusUpdate(
  status: string,
): SupportRecommendationStatus {
  const allowed: SupportRecommendationStatus[] = ["VIEWED", "IMPLEMENTED", "DISMISSED"];
  if (!allowed.includes(status as SupportRecommendationStatus)) {
    throw new Error("Invalid recommendation status");
  }
  return status as SupportRecommendationStatus;
}

export function formatConfidence(score: number | null): string {
  if (score === null) return "—";
  return `${Math.round(score * 100)}%`;
}
