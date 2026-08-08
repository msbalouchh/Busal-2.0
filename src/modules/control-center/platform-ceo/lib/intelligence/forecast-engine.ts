import "server-only";

import type { PlatformCeoExecutiveContext } from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import type { ExecutiveForecast } from "@/modules/control-center/platform-ceo/types/platform-ceo-intelligence.types";

function projectValue(current: number, growthPct: number | null, horizonDays: number): number {
  const dailyRate = (growthPct ?? 3) / 100 / 30;
  return Math.round(current * (1 + dailyRate * horizonDays));
}

export function buildExecutiveForecasts(context: PlatformCeoExecutiveContext): ExecutiveForecast[] {
  const revenueScore = context.intelligenceSummary.scores.find((s) => s.id === "period-revenue");
  const growthScore = context.intelligenceSummary.scores.find((s) => s.id === "growth");
  const churnScore = context.intelligenceSummary.scores.find((s) => s.id === "churn-risk");
  const forecastScore = context.intelligenceSummary.scores.find((s) => s.id === "revenue-forecast");
  const mrrScore = context.intelligenceSummary.scores.find((s) => s.id === "mrr");

  const revenueCurrent = revenueScore?.value ?? forecastScore?.value ?? null;
  const growthPct = growthScore?.value ?? null;
  const churnCurrent = churnScore?.value ?? null;

  const forecasts: ExecutiveForecast[] = [];

  if (revenueCurrent != null) {
    const projected30 = projectValue(revenueCurrent, growthPct, 30);
    forecasts.push({
      id: "revenue-forecast-30d",
      label: "Revenue Forecast (30d)",
      currentValue: revenueCurrent,
      projectedValue: projected30,
      horizonDays: 30,
      trend: projected30 >= revenueCurrent ? "up" : "down",
      confidence: 68,
      narrative: `Projected revenue movement over 30 days based on current growth signals (${growthPct ?? "stable"}% trend).`,
    });
  }

  if (mrrScore?.value != null || revenueCurrent != null) {
    const mrr = mrrScore?.value ?? Math.round((revenueCurrent ?? 0) / 12);
    forecasts.push({
      id: "mrr-forecast",
      label: "MRR Forecast",
      currentValue: mrr,
      projectedValue: projectValue(mrr, growthPct, 30),
      horizonDays: 30,
      trend: (growthPct ?? 0) >= 0 ? "up" : "down",
      confidence: 65,
      narrative: "MRR trajectory inferred from commercial and subscription signals in Platform Intelligence.",
    });
  }

  if (growthScore?.value != null) {
    forecasts.push({
      id: "growth-forecast",
      label: "Growth Forecast",
      currentValue: growthScore.value,
      projectedValue: Math.min(100, growthScore.value + Math.round((growthPct ?? 2) / 2)),
      horizonDays: 30,
      trend: (growthPct ?? 0) >= 0 ? "up" : "down",
      confidence: 70,
      narrative: "Growth outlook based on new business velocity and expansion scores.",
    });
  }

  if (churnCurrent != null) {
    forecasts.push({
      id: "churn-forecast",
      label: "Churn Risk Forecast",
      currentValue: churnCurrent,
      projectedValue: Math.min(100, Math.max(0, churnCurrent + (churnCurrent > 50 ? 5 : -3))),
      horizonDays: 30,
      trend: churnCurrent > 50 ? "up" : "down",
      confidence: 67,
      narrative: "Churn risk projection based on at-risk business concentration and support signals.",
    });
  }

  return forecasts;
}
