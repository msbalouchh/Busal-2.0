"use client";

import { KpiCard } from "@/modules/reporting/components/widgets/kpi-card";
import { ChartCard } from "@/modules/reporting/components/widgets/chart-card";
import { DataTableWidget } from "@/modules/reporting/components/widgets/data-table-widget";
import { TrendChart } from "@/modules/reporting/components/widgets/lazy-trend-chart";
import type {
  ChartDataPoint,
  KpiMetric,
  TableRow,
} from "@/modules/restaurant-analytics-management/types/restaurant-analytics-types";

interface AnalyticsChartSection {
  title: string;
  data: ChartDataPoint[];
  variant?: "bar" | "line";
  valueFormatter?: (value: number) => string;
}

interface AnalyticsTableSection {
  title: string;
  headers: string[];
  rows: TableRow[];
}

interface AnalyticsViewProps {
  kpis?: KpiMetric[];
  charts?: AnalyticsChartSection[];
  tables?: AnalyticsTableSection[];
}

export function AnalyticsView({ kpis = [], charts = [], tables = [] }: AnalyticsViewProps) {
  return (
    <div className="space-y-6 print:space-y-4">
      {kpis.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} />
          ))}
        </div>
      ) : null}

      {charts.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {charts.map((chart) => (
            <ChartCard key={chart.title} title={chart.title} isEmpty={chart.data.length === 0}>
              <TrendChart
                data={chart.data}
                variant={chart.variant ?? "bar"}
                valueFormatter={chart.valueFormatter}
              />
            </ChartCard>
          ))}
        </div>
      ) : null}

      {tables.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {tables.map((table) => (
            <DataTableWidget
              key={table.title}
              title={table.title}
              headers={table.headers}
              rows={table.rows.map((row) => row.cells)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
