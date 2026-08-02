import type { RecommendationStatus, SalesPriority } from "@prisma/client";

export interface SalesInsightRecord {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  priority: SalesPriority;
  category: string;
  recommendation: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SalesRecommendationRecord {
  id: string;
  businessId: string;
  customerId: string | null;
  customerName: string | null;
  title: string;
  description: string | null;
  action: string;
  priority: SalesPriority;
  status: RecommendationStatus;
  expectedImpact: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SalesInsightListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  priority?: SalesPriority | "ALL";
  status?: string;
}

export interface SalesRecommendationListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  priority?: SalesPriority | "ALL";
  status?: RecommendationStatus | "ALL";
  customerId?: string;
}

export type SalesForecastHorizon = "week" | "month" | "quarter";

export interface SalesForecastRequest {
  horizon?: SalesForecastHorizon;
}

export interface SalesForecastResult {
  businessId: string;
  horizon: SalesForecastHorizon;
  projectedRevenuePence: number;
  confidence: number;
  methodology: string;
  assumptions: string[];
  dataPoints: Array<{ label: string; revenuePence: number; orders: number }>;
  generatedAt: string;
}

export const SALES_INSIGHT_CATEGORIES = [
  "revenue",
  "pipeline",
  "quotes",
  "customers",
  "products",
  "follow_up",
] as const;

export type SalesInsightCategory = (typeof SALES_INSIGHT_CATEGORIES)[number];
