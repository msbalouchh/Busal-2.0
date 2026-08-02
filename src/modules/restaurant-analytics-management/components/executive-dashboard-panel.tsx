"use client";

import { AnalyticsDashboardShell } from "@/modules/restaurant-analytics-management/components/analytics-dashboard-shell";
import { AnalyticsView } from "@/modules/restaurant-analytics-management/components/analytics-view";
import { RESTAURANT_ANALYTICS_ROUTES } from "@/modules/restaurant-analytics-management/constants/routes";
import type { RestaurantAnalyticsContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import type {
  DashboardWidgetRecord,
  ExecutiveDashboardData,
} from "@/modules/restaurant-analytics-management/types/restaurant-analytics-types";
import { KpiCard } from "@/modules/reporting/components/widgets/kpi-card";

interface ExecutiveDashboardPanelProps {
  context: RestaurantAnalyticsContext;
  dashboard: ExecutiveDashboardData;
  widgets: DashboardWidgetRecord[];
}

export function ExecutiveDashboardPanel({
  context,
  dashboard,
  widgets,
}: ExecutiveDashboardPanelProps) {
  return (
    <AnalyticsDashboardShell
      context={context}
      basePath={RESTAURANT_ANALYTICS_ROUTES.dashboard()}
      reportType="CUSTOM"
      title="Executive Dashboard"
    >
      <AnalyticsView
        kpis={dashboard.kpis}
        charts={[
          {
            title: "Revenue trend",
            data: dashboard.revenueTrend,
            variant: "line",
            valueFormatter: (value) => `£${value.toFixed(2)}`,
          },
          {
            title: "Peak hours",
            data: dashboard.ordersByHour,
            variant: "bar",
          },
          {
            title: "Payment methods",
            data: dashboard.paymentMethods,
            variant: "bar",
            valueFormatter: (value) => `£${value.toFixed(2)}`,
          },
        ]}
        tables={[
          {
            title: "Top selling products",
            headers: ["Product", "Qty", "Revenue"],
            rows: dashboard.topProducts,
          },
        ]}
      />

      {context.permissionsFlags.canManageDashboard && widgets.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Dashboard widgets</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {widgets.map((widget) => (
              <KpiCard key={widget.id} label={widget.title} value={widget.widgetType} />
            ))}
          </div>
        </section>
      ) : null}
    </AnalyticsDashboardShell>
  );
}
