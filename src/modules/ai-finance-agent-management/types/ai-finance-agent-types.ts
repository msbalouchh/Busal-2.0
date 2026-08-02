import type { FinancePriority, FinanceRecommendationStatus } from "@prisma/client";

export interface FinanceInsightRecord {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  category: string;
  priority: FinancePriority;
  recommendation: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceRecommendationRecord {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  action: string;
  expectedImpact: string | null;
  confidenceScore: number | null;
  status: FinanceRecommendationStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceInsightListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  priority?: FinancePriority | "ALL";
  category?: string;
  status?: string;
}

export interface FinanceRecommendationListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: FinanceRecommendationStatus | "ALL";
}
