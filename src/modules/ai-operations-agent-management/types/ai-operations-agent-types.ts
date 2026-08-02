import type { OperationPriority, OperationRecommendationStatus } from "@prisma/client";

export interface OperationInsightRecord {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  category: string;
  priority: OperationPriority;
  recommendation: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OperationRecommendationRecord {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  action: string;
  expectedImpact: string | null;
  confidenceScore: number | null;
  status: OperationRecommendationStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OperationInsightListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  priority?: OperationPriority | "ALL";
  category?: string;
  status?: string;
}

export interface OperationRecommendationListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: OperationRecommendationStatus | "ALL";
}
