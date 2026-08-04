"use client";

import { useMemo } from "react";

import { useAnalytics } from "@/modules/analytics/hooks/use-analytics";
import type { AnalyticsReportsContextValue } from "@/modules/analytics/types/analytics-platform";

export function useAnalyticsReports(): AnalyticsReportsContextValue {
  const { record, refresh } = useAnalytics();

  const reports = useMemo(() => record.reports, [record.reports]);
  const savedReports = useMemo(() => record.savedReports, [record.savedReports]);
  const scheduledReports = useMemo(() => record.scheduledReports, [record.scheduledReports]);

  return {
    reports,
    savedReports,
    scheduledReports,
    refresh,
  };
}
