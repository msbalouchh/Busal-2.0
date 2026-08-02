import type { CampaignStatus, MarketingPriority } from "@prisma/client";

export interface MarketingInsightRecord {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  category: string;
  priority: MarketingPriority;
  recommendation: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingCampaignRecord {
  id: string;
  businessId: string;
  name: string;
  type: string;
  status: CampaignStatus;
  objective: string | null;
  targetAudience: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingInsightListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  priority?: MarketingPriority | "ALL";
  status?: string;
}

export type MarketingForecastHorizon = "week" | "month";

export const MARKETING_INSIGHT_CATEGORIES = [
  "campaign",
  "audience",
  "segment",
  "promotion",
  "retention",
  "engagement",
  "conversion",
  "performance",
  "opportunity",
] as const;

export type MarketingInsightCategory = (typeof MARKETING_INSIGHT_CATEGORIES)[number];
