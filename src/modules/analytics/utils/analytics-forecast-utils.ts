import type { Forecast } from "@/modules/analytics/types/analytics-platform";

export interface RevenueForecastInput {
  historicalValues: number[];
  periodsAhead: number;
  growthRate?: number;
}

export interface DemandForecastInput {
  historicalCounts: number[];
  periodsAhead: number;
  seasonalityFactor?: number;
}

/** Simple linear revenue forecast (architecture only). */
export function forecastRevenue(input: RevenueForecastInput): Array<{
  period: number;
  value: number;
  lowerBound: number;
  upperBound: number;
}> {
  const growthRate = input.growthRate ?? 0.05;
  const base: number =
    input.historicalValues.length > 0
      ? (input.historicalValues[input.historicalValues.length - 1] ?? 0)
      : 0;

  return Array.from({ length: input.periodsAhead }, (_, i) => {
    const value = Math.round(base * Math.pow(1 + growthRate, i + 1));
    const variance = Math.round(value * 0.12);

    return {
      period: i + 1,
      value,
      lowerBound: value - variance,
      upperBound: value + variance,
    };
  });
}

/** Simple demand forecast with optional seasonality (architecture only). */
export function forecastDemand(input: DemandForecastInput): Array<{
  period: number;
  value: number;
  lowerBound: number;
  upperBound: number;
}> {
  const seasonality = input.seasonalityFactor ?? 1.0;
  const base =
    input.historicalCounts.length > 0
      ? input.historicalCounts.reduce((sum, v) => sum + v, 0) / input.historicalCounts.length
      : 0;

  return Array.from({ length: input.periodsAhead }, (_, i) => {
    const value = Math.round(base * seasonality * (1 + i * 0.02));
    const variance = Math.round(value * 0.15);

    return {
      period: i + 1,
      value,
      lowerBound: Math.max(0, value - variance),
      upperBound: value + variance,
    };
  });
}

export function getForecastTotal(forecast: Forecast): number {
  return forecast.projectedValues.reduce((sum, point) => sum + point.value, 0);
}

export function getAverageConfidence(forecasts: Forecast[]): number {
  if (forecasts.length === 0) {
    return 0;
  }

  const total = forecasts.reduce((sum, f) => sum + f.confidenceScore, 0);
  return total / forecasts.length;
}
