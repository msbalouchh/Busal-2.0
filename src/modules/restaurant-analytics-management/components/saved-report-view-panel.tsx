"use client";

import { AnalyticsDashboardShell } from "@/modules/restaurant-analytics-management/components/analytics-dashboard-shell";
import { AnalyticsView } from "@/modules/restaurant-analytics-management/components/analytics-view";
import { REPORT_TYPE_LABELS } from "@/modules/restaurant-analytics-management/lib/restaurant-analytics-validation";
import type { RestaurantAnalyticsContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import type {
  CustomReportResult,
  SavedReportRecord,
} from "@/modules/restaurant-analytics-management/types/restaurant-analytics-types";

interface SavedReportViewPanelProps {
  context: RestaurantAnalyticsContext;
  report: SavedReportRecord;
  result: CustomReportResult;
}

export function SavedReportViewPanel({ context, report, result }: SavedReportViewPanelProps) {
  return (
    <AnalyticsDashboardShell
      context={{ ...context, filters: report.filters }}
      basePath={`/app/restaurant/analytics/reports/${report.id}`}
      reportType={report.reportType}
      title={report.name}
    >
      {report.description ? (
        <p className="text-muted-foreground text-sm">{report.description}</p>
      ) : null}
      <p className="text-muted-foreground text-xs">Type: {REPORT_TYPE_LABELS[report.reportType]}</p>
      <AnalyticsView
        kpis={result.kpis}
        charts={
          result.chartData.length > 0
            ? [
                {
                  title: "Chart",
                  data: result.chartData,
                  variant: "bar",
                },
              ]
            : []
        }
        tables={[
          {
            title: "Report data",
            headers: result.tableHeaders,
            rows: result.tableRows,
          },
        ]}
      />
    </AnalyticsDashboardShell>
  );
}
