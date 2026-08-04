"use client";

import { useMemo } from "react";

import { useAnalytics } from "@/modules/analytics/hooks/use-analytics";
import type { AnalyticsDashboardContextValue } from "@/modules/analytics/types/analytics-platform";

export function useAnalyticsDashboard(): AnalyticsDashboardContextValue {
  const { record, selectedDashboardId, selectDashboard, refresh } = useAnalytics();

  const dashboards = useMemo(() => record.dashboards, [record.dashboards]);
  const widgets = useMemo(() => {
    if (!selectedDashboardId) {
      return record.widgets;
    }

    return record.widgets.filter((w) => w.dashboardId === selectedDashboardId);
  }, [record.widgets, selectedDashboardId]);

  const kpis = useMemo(() => record.kpis, [record.kpis]);

  return {
    dashboards,
    widgets,
    kpis,
    selectedDashboardId,
    selectDashboard,
    refresh,
  };
}
