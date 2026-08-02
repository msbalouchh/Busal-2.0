import type { SupportPriority, SupportRecommendationStatus } from "@prisma/client";

export interface SupportInsightRecord {
  id: string;
  businessId: string;
  customerId: string | null;
  customerName: string | null;
  ticketId: string | null;
  title: string;
  description: string | null;
  priority: SupportPriority;
  recommendation: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SupportRecommendationRecord {
  id: string;
  businessId: string;
  ticketId: string | null;
  customerId: string | null;
  customerName: string | null;
  title: string;
  description: string | null;
  action: string;
  confidenceScore: number | null;
  status: SupportRecommendationStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SupportInsightListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  priority?: SupportPriority | "ALL";
  status?: string;
  ticketId?: string;
  customerId?: string;
}

export interface SupportRecommendationListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: SupportRecommendationStatus | "ALL";
  ticketId?: string;
  customerId?: string;
}
