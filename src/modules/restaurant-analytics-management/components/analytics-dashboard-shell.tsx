"use client";

import type { ReactNode } from "react";

import { AnalyticsFiltersBar } from "@/modules/restaurant-analytics-management/components/analytics-filters-bar";
import { AnalyticsNav } from "@/modules/restaurant-analytics-management/components/analytics-nav";
import { ExportReportButtons } from "@/modules/restaurant-analytics-management/components/export-report-buttons";
import type { RestaurantAnalyticsContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import type { ReportType } from "@prisma/client";

interface AnalyticsDashboardShellProps {
  context: RestaurantAnalyticsContext;
  basePath: string;
  reportType: ReportType;
  title: string;
  children: ReactNode;
}

export function AnalyticsDashboardShell({
  context,
  basePath,
  reportType,
  title,
  children,
}: AnalyticsDashboardShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-muted-foreground text-sm">
            {context.filters.dateRange.from} to {context.filters.dateRange.to}
          </p>
        </div>
        <ExportReportButtons
          reportType={reportType}
          filters={context.filters}
          title={title}
          canExport={context.permissionsFlags.canExport}
        />
      </div>

      <AnalyticsNav />
      <AnalyticsFiltersBar context={context} basePath={basePath} />
      {children}
    </div>
  );
}
