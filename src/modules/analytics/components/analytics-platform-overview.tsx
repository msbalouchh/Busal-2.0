"use client";

import { AnalyticsManagementEmpty } from "@/modules/analytics/components/analytics-management-empty";
import { AnalyticsManagementError } from "@/modules/analytics/components/analytics-management-error";
import { AnalyticsManagementLoading } from "@/modules/analytics/components/analytics-management-loading";
import { DashboardTypeBadge } from "@/modules/analytics/components/dashboard-type-badge";
import { KpiTrendBadge } from "@/modules/analytics/components/kpi-trend-badge";
import { useAnalytics } from "@/modules/analytics/hooks/use-analytics";
import { formatMoney } from "@/modules/analytics/utils/analytics-selectors";

export function AnalyticsPlatformOverview() {
  const { record, refresh, isRefreshing, error } = useAnalytics();

  if (isRefreshing && record.dashboards.length === 0 && record.kpis.length === 0) {
    return <AnalyticsManagementLoading />;
  }

  if (error && record.dashboards.length === 0 && record.kpis.length === 0) {
    return <AnalyticsManagementError message={error} onRetry={refresh} />;
  }

  if (record.dashboards.length === 0 && record.kpis.length === 0) {
    return <AnalyticsManagementEmpty />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Revenue</p>
          <p className="text-2xl font-semibold">{formatMoney(record.sales.totalRevenueCents)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Orders</p>
          <p className="text-2xl font-semibold">{record.sales.orderCount.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">KPIs</p>
          <p className="text-2xl font-semibold">{record.kpis.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Active Alerts</p>
          <p className="text-2xl font-semibold">{record.alerts.filter((a) => !a.isAcknowledged).length}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Dashboards</h3>
          <button type="button" className="text-primary text-sm font-medium" onClick={refresh} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {record.dashboards.slice(0, 6).map((dashboard) => (
            <div key={dashboard.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{dashboard.name}</p>
                <DashboardTypeBadge dashboardType={dashboard.dashboardType} />
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{dashboard.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Top KPIs</h3>
        <div className="space-y-3">
          {record.kpis.slice(0, 8).map((kpi) => (
            <div key={kpi.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">{kpi.label}</p>
                <p className="text-muted-foreground text-sm">{kpi.moduleSource}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold">
                  {kpi.unit === "GBP_cents" ? formatMoney(kpi.currentValue) : kpi.currentValue.toLocaleString()}
                </p>
                <KpiTrendBadge trend={kpi.trend} changePercent={kpi.changePercent} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
