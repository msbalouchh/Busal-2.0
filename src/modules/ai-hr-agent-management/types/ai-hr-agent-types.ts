import type { HRPriority, HRRecommendationStatus } from "@prisma/client";

export interface HrInsightRecord {
  id: string;
  businessId: string;
  staffId: string | null;
  staffName: string | null;
  title: string;
  description: string | null;
  category: string;
  priority: HRPriority;
  recommendation: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface HrRecommendationRecord {
  id: string;
  businessId: string;
  staffId: string | null;
  staffName: string | null;
  title: string;
  description: string | null;
  action: string;
  confidenceScore: number | null;
  status: HRRecommendationStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface HrInsightListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  priority?: HRPriority | "ALL";
  category?: string;
  status?: string;
  staffId?: string;
}

export interface HrRecommendationListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: HRRecommendationStatus | "ALL";
  staffId?: string;
}
