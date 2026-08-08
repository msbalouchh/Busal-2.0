export type ControlCenterAnalyticsRange = 7 | 30 | 90;

export interface ControlCenterAnalyticsPermissions {
  canView: boolean;
  canExport: boolean;
}

export interface ControlCenterAnalyticsQuery {
  rangeDays?: ControlCenterAnalyticsRange;
  comparePrevious?: boolean;
  search?: string;
  section?: string | null;
  page?: number;
  pageSize?: number;
}

export interface ControlCenterAnalyticsKpi {
  id: string;
  label: string;
  value: number;
  previousValue: number | null;
  growthPct: number | null;
  format: "number" | "currency" | "percent" | "bytes";
}

export interface ControlCenterAnalyticsTrendSeries {
  id: string;
  label: string;
  points: Array<{ day: string; value: number }>;
  comparisonPoints?: Array<{ day: string; value: number }>;
}

export interface ControlCenterAnalyticsTableRow {
  id: string;
  primary: string;
  secondary: string | null;
  metric: string;
  metricLabel: string;
}

export interface ControlCenterAnalyticsTable {
  id: string;
  title: string;
  rows: ControlCenterAnalyticsTableRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ControlCenterAnalyticsSection {
  id: string;
  title: string;
  description: string;
  kpis: ControlCenterAnalyticsKpi[];
  trends: ControlCenterAnalyticsTrendSeries[];
  tables: ControlCenterAnalyticsTable[];
}

export interface ControlCenterPlatformAnalyticsBundle {
  executiveKpis: ControlCenterAnalyticsKpi[];
  sections: ControlCenterAnalyticsSection[];
  permissions: ControlCenterAnalyticsPermissions;
  rangeDays: ControlCenterAnalyticsRange;
  comparePrevious: boolean;
  refreshedAt: string;
}
