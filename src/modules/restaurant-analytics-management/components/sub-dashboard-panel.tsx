"use client";

import { AnalyticsDashboardShell } from "@/modules/restaurant-analytics-management/components/analytics-dashboard-shell";
import { AnalyticsView } from "@/modules/restaurant-analytics-management/components/analytics-view";
import type { RestaurantAnalyticsContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import type {
  ChartDataPoint,
  KpiMetric,
  TableRow,
} from "@/modules/restaurant-analytics-management/types/restaurant-analytics-types";
import type { ReportType } from "@prisma/client";

interface SubDashboardPanelProps {
  context: RestaurantAnalyticsContext;
  basePath: string;
  reportType: ReportType;
  title: string;
  kpis?: KpiMetric[];
  charts?: Array<{
    title: string;
    data: ChartDataPoint[];
    variant?: "bar" | "line";
    valueFormatter?: (value: number) => string;
  }>;
  tables?: Array<{ title: string; headers: string[]; rows: TableRow[] }>;
}

export function SubDashboardPanel({
  context,
  basePath,
  reportType,
  title,
  kpis,
  charts,
  tables,
}: SubDashboardPanelProps) {
  return (
    <AnalyticsDashboardShell
      context={context}
      basePath={basePath}
      reportType={reportType}
      title={title}
    >
      <AnalyticsView kpis={kpis} charts={charts} tables={tables} />
    </AnalyticsDashboardShell>
  );
}
