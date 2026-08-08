export type PlatformIntelligenceRange = 7 | 30 | 90 | 365 | "all";

export type PlatformIntelligenceDrillDown =
  | "platform"
  | "tenant"
  | "workspace"
  | "business"
  | "module";

export interface PlatformIntelligencePermissions {
  canView: boolean;
  canExport: boolean;
  canConfigure: boolean;
  isPlatformOwner: boolean;
}

export interface PlatformIntelligenceQuery {
  range?: PlatformIntelligenceRange;
  comparePrevious?: boolean;
  search?: string;
  drillDown?: PlatformIntelligenceDrillDown;
  drillDownId?: string | null;
  module?: string | null;
  page?: number;
  pageSize?: number;
}

export interface PlatformIntelligenceScore {
  id: string;
  label: string;
  value: number;
  previousValue: number | null;
  growthPct: number | null;
  format: "score" | "percent" | "currency" | "number";
}

export interface PlatformIntelligenceTrendPoint {
  day: string;
  value: number;
}

export interface PlatformIntelligenceTrendSeries {
  id: string;
  label: string;
  points: PlatformIntelligenceTrendPoint[];
}

export interface PlatformIntelligenceBusinessRanking {
  id: string;
  name: string;
  workspaceId: string;
  score: number;
  metric: string;
  metricLabel: string;
  secondary: string | null;
  riskLevel: "low" | "medium" | "high" | null;
}

export interface PlatformIntelligenceAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  module: string | null;
}

export interface PlatformIntelligenceRecommendation {
  id: string;
  priority: "low" | "medium" | "high";
  title: string;
  description: string;
  actionLabel: string | null;
}

export interface PlatformIntelligenceExecutiveSummary {
  weekly: string;
  monthly: string;
}

export interface PlatformIntelligenceTable {
  id: string;
  title: string;
  rows: PlatformIntelligenceBusinessRanking[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PlatformIntelligenceBundle {
  platformScores: PlatformIntelligenceScore[];
  executiveSummary: PlatformIntelligenceExecutiveSummary;
  trends: PlatformIntelligenceTrendSeries[];
  topBusinesses: PlatformIntelligenceBusinessRanking[];
  atRiskBusinesses: PlatformIntelligenceBusinessRanking[];
  dormantBusinesses: PlatformIntelligenceBusinessRanking[];
  fastestGrowing: PlatformIntelligenceBusinessRanking[];
  businessHealthRankings: PlatformIntelligenceTable;
  alerts: PlatformIntelligenceAlert[];
  recommendations: PlatformIntelligenceRecommendation[];
  operationalInsights: string[];
  permissions: PlatformIntelligencePermissions;
  range: PlatformIntelligenceRange;
  comparePrevious: boolean;
  refreshedAt: string;
}
