"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { AnalyticsContext } from "@/modules/analytics/contexts/analytics-context";
import { analyticsRepository } from "@/modules/analytics/repository/analytics-repository";
import {
  buildAnalyticsPlatformContext,
  buildAnalyticsPlatformSnapshot,
  type AnalyticsPlatformInput,
} from "@/modules/analytics/services/analytics-platform.service";
import type { AnalyticsContextValue } from "@/modules/analytics/types/analytics-platform";

interface AnalyticsProviderProps {
  children: ReactNode;
  initialInput?: AnalyticsPlatformInput;
}

export function AnalyticsProvider({ children, initialInput }: AnalyticsProviderProps) {
  const [input] = useState<AnalyticsPlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildAnalyticsPlatformSnapshot(input));
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(
    () => analyticsRepository.getDefaultDashboard()?.id ?? null,
  );

  const refresh = useCallback(() => {
    setSnapshot(buildAnalyticsPlatformSnapshot(input));
  }, [input]);

  const value = useMemo<AnalyticsContextValue>(() => {
    const context = buildAnalyticsPlatformContext(input);
    const selectedDashboard = selectedDashboardId
      ? (analyticsRepository.findDashboardById(selectedDashboardId) ?? null)
      : null;

    return {
      context,
      record: snapshot.record,
      selectedDashboardId,
      selectedDashboard,
      selectDashboard: setSelectedDashboardId,
      refresh,
    };
  }, [input, snapshot, selectedDashboardId, refresh]);

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}
