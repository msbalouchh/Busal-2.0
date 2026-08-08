"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { AnalyticsContext } from "@/modules/analytics/contexts/analytics-context";
import { buildAnalyticsPlatformContext } from "@/modules/analytics/lib/analytics-platform-context";
import type { AnalyticsPlatformSnapshot } from "@/modules/analytics/services/analytics-platform.service";
import type { AnalyticsContextValue, AnalyticsPlatformContext } from "@/modules/analytics/types/analytics-platform";

interface AnalyticsProviderProps {
  children: ReactNode;
  initialInput?: AnalyticsPlatformContext;
  initialSnapshot?: AnalyticsPlatformSnapshot;
}

export function AnalyticsProvider({ children, initialInput, initialSnapshot }: AnalyticsProviderProps) {
  const [input] = useState<AnalyticsPlatformContext>(
    () =>
      initialInput ??
      initialSnapshot?.context ??
      buildAnalyticsPlatformContext({ businessId: "", branchId: "" }),
  );
  const [snapshot, setSnapshot] = useState<AnalyticsPlatformSnapshot | null>(initialSnapshot ?? null);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(
    () => initialSnapshot?.record.dashboards.find((dashboard) => dashboard.isDefault)?.id ?? null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);

    void fetch("/api/analytics?snapshot=true")
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          data?: AnalyticsPlatformSnapshot;
          error?: string;
        };

        if (!payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to refresh analytics data");
        }

        setSnapshot(payload.data);
        if (!selectedDashboardId && payload.data.record.dashboards.length > 0) {
          const defaultDashboard =
            payload.data.record.dashboards.find((dashboard) => dashboard.isDefault) ??
            payload.data.record.dashboards[0];
          if (defaultDashboard) {
            setSelectedDashboardId(defaultDashboard.id);
          }
        }
      })
      .catch((refreshError: unknown) => {
        setError(refreshError instanceof Error ? refreshError.message : "Refresh failed");
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, [selectedDashboardId]);

  const value = useMemo<AnalyticsContextValue>(() => {
    const context = snapshot?.context ?? input;
    const record = snapshot?.record ?? {
      dashboards: [],
      widgets: [],
      metrics: [],
      kpis: [],
      charts: [],
      reports: [],
      reportTemplates: [],
      savedReports: [],
      scheduledReports: [],
      insights: [],
      forecasts: [],
      alerts: [],
      benchmarks: [],
      dataSources: [],
      dashboardLayouts: [],
      savedViews: [],
      sales: {
        tenantId: context.tenantId,
        businessId: context.businessId,
        branchId: context.branchId,
        totalRevenueCents: 0,
        orderCount: 0,
        averageOrderValueCents: 0,
        topSellingItems: [],
        revenueByHour: [],
        periodStart: "",
        periodEnd: "",
      },
      customers: {
        tenantId: context.tenantId,
        businessId: context.businessId,
        totalCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        retentionRateBps: 0,
        averageLifetimeValueCents: 0,
        topSegments: [],
        periodStart: "",
        periodEnd: "",
      },
      menu: {
        tenantId: context.tenantId,
        businessId: context.businessId,
        branchId: context.branchId,
        totalItems: 0,
        activeItems: 0,
        topPerformers: [],
        underperformers: [],
        categoryBreakdown: [],
        periodStart: "",
        periodEnd: "",
      },
      reservations: {
        tenantId: context.tenantId,
        businessId: context.businessId,
        branchId: context.branchId,
        totalReservations: 0,
        confirmedCount: 0,
        cancelledCount: 0,
        noShowCount: 0,
        noShowRateBps: 0,
        averagePartySize: 0,
        peakHours: [],
        periodStart: "",
        periodEnd: "",
      },
      kitchen: {
        tenantId: context.tenantId,
        businessId: context.businessId,
        branchId: context.branchId,
        totalTickets: 0,
        averagePrepTimeMin: 0,
        onTimeRateBps: 0,
        stationBreakdown: [],
        rushHourPeak: "",
        periodStart: "",
        periodEnd: "",
      },
      inventory: {
        tenantId: context.tenantId,
        businessId: context.businessId,
        branchId: context.branchId,
        totalSkus: 0,
        lowStockCount: 0,
        wasteValueCents: 0,
        turnoverRateBps: 0,
        topConsumedItems: [],
        periodStart: "",
        periodEnd: "",
      },
      staff: {
        tenantId: context.tenantId,
        businessId: context.businessId,
        branchId: context.branchId,
        totalStaff: 0,
        activeShifts: 0,
        labourCostCents: 0,
        labourCostPercentBps: 0,
        overtimeHours: 0,
        attendanceRateBps: 0,
        periodStart: "",
        periodEnd: "",
      },
      finance: {
        tenantId: context.tenantId,
        businessId: context.businessId,
        revenueCents: 0,
        expenseCents: 0,
        netProfitCents: 0,
        grossMarginBps: 0,
        accountsReceivableCents: 0,
        cashOnHandCents: 0,
        periodStart: "",
        periodEnd: "",
      },
      billing: {
        tenantId: context.tenantId,
        mrrCents: 0,
        arrCents: 0,
        activeSubscriptions: 0,
        churnRateBps: 0,
        upgradeCount: 0,
        downgradeCount: 0,
        periodStart: "",
        periodEnd: "",
      },
      aiContext: {
        tenantId: context.tenantId,
        summary: "",
        topInsights: [],
        anomalyCount: 0,
        forecastConfidence: 0,
        recommendedActions: [],
        executiveSummary: "",
        lastGeneratedAt: new Date().toISOString(),
      },
    };

    const selectedDashboard = selectedDashboardId
      ? (record.dashboards.find((dashboard) => dashboard.id === selectedDashboardId) ?? null)
      : null;

    return {
      context,
      record,
      selectedDashboardId,
      selectedDashboard,
      selectDashboard: setSelectedDashboardId,
      refresh,
      isRefreshing,
      error,
    };
  }, [input, snapshot, selectedDashboardId, refresh, isRefreshing, error]);

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}
