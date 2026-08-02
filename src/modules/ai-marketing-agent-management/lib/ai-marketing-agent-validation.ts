import type { MarketingPriority } from "@prisma/client";

import type {
  MarketingInsightListQuery,
  MarketingInsightRecord,
} from "@/modules/ai-marketing-agent-management/types/ai-marketing-agent-types";

export function serializeMarketingInsight(insight: {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  category: string;
  priority: MarketingPriority;
  recommendation: string | null;
  status: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): MarketingInsightRecord {
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

export function validateMarketingInsightListQuery(
  query: MarketingInsightListQuery,
): MarketingInsightListQuery {
  return {
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(100, Math.max(1, query.pageSize ?? 20)),
    search: query.search?.trim() || undefined,
    category: query.category || undefined,
    priority: query.priority ?? "ALL",
    status: query.status ?? "ALL",
  };
}

export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function formatPercent(value: number): string {
  return `${value}%`;
}
