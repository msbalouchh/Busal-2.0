"use client";

import { useContext } from "react";

import { AnalyticsContext } from "@/modules/analytics/contexts/analytics-context";
import type { AnalyticsContextValue } from "@/modules/analytics/types/analytics-platform";

export function useAnalyticsContext(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error("useAnalyticsContext must be used within AnalyticsProvider");
  }

  return context;
}

export function useAnalytics(): AnalyticsContextValue {
  return useAnalyticsContext();
}
