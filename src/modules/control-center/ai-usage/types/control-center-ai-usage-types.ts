export type ControlCenterAiUsageRange = 7 | 30 | 90;

export interface ControlCenterAiUsagePermissions {
  canView: boolean;
  canExport: boolean;
}

export interface ControlCenterAiUsageQuery {
  rangeDays?: ControlCenterAiUsageRange;
  comparePrevious?: boolean;
  search?: string;
  section?: string | null;
  page?: number;
  pageSize?: number;
  provider?: string | null;
  businessId?: string | null;
  model?: string | null;
  module?: string | null;
}

export interface ControlCenterAiUsageKpi {
  id: string;
  label: string;
  value: number;
  previousValue: number | null;
  growthPct: number | null;
  format: "number" | "currency" | "percent" | "duration" | "rate";
}

export interface ControlCenterAiUsageTrendSeries {
  id: string;
  label: string;
  points: Array<{ day: string; value: number }>;
}

export interface ControlCenterAiUsageMonthlyPoint {
  month: string;
  value: number;
}

export interface ControlCenterAiUsageTableRow {
  id: string;
  primary: string;
  secondary: string | null;
  metric: string;
  metricLabel: string;
}

export interface ControlCenterAiUsageTable {
  id: string;
  title: string;
  rows: ControlCenterAiUsageTableRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ControlCenterAiUsageFilterOptions {
  providers: string[];
  businesses: Array<{ id: string; name: string }>;
  models: string[];
  modules: string[];
}

export interface ControlCenterAiUsageSection {
  id: string;
  title: string;
  description: string;
  kpis: ControlCenterAiUsageKpi[];
  trends: ControlCenterAiUsageTrendSeries[];
  monthlyTrends: ControlCenterAiUsageMonthlyPoint[];
  tables: ControlCenterAiUsageTable[];
}

export interface ControlCenterAiUsageBundle {
  executiveKpis: ControlCenterAiUsageKpi[];
  sections: ControlCenterAiUsageSection[];
  permissions: ControlCenterAiUsagePermissions;
  filterOptions: ControlCenterAiUsageFilterOptions;
  rangeDays: ControlCenterAiUsageRange;
  comparePrevious: boolean;
  refreshedAt: string;
}
