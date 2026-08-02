import "server-only";

import type {
  SalesForecastHorizon,
  SalesForecastRequest,
  SalesForecastResult,
} from "@/modules/ai-sales-agent-management/types/ai-sales-agent-types";
import { getRevenueTrendPoints } from "@/services/ai-sales-revenue-insight.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

/**
 * Provider-agnostic forecast framework.
 * Computes simple trend-based projections from existing revenue data.
 * External LLM or ML providers can be plugged in later without changing callers.
 */
export async function generateSalesForecast(
  ownerId: string,
  request: SalesForecastRequest = {},
): Promise<SalesForecastResult> {
  const horizon: SalesForecastHorizon = request.horizon ?? "month";
  const business = await getOrCreateBusinessForOwner(ownerId);
  const trendPoints = await getRevenueTrendPoints(ownerId);

  const weekPoint = trendPoints.find((p) => p.label === "This week");
  const monthPoint = trendPoints.find((p) => p.label === "This month");

  const baseRevenue =
    horizon === "week" ? (weekPoint?.revenuePence ?? 0) : (monthPoint?.revenuePence ?? 0);
  const projectedRevenuePence = Math.round(baseRevenue * (horizon === "week" ? 1.05 : 1.08));
  const confidence = trendPoints.length >= 3 ? 0.65 : 0.45;

  return {
    businessId: business.id,
    horizon,
    projectedRevenuePence,
    confidence,
    methodology: "trend_extrapolation",
    assumptions: [
      "Based on current period revenue trend",
      "Does not account for seasonality or pipeline conversion",
    ],
    dataPoints: trendPoints,
    generatedAt: new Date().toISOString(),
  };
}

export function getForecastHorizons(): SalesForecastHorizon[] {
  return ["week", "month", "quarter"];
}
