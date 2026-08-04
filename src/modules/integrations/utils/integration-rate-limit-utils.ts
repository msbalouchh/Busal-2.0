import type { ApiRateLimit, ApiUsage } from "@/modules/integrations/types/integration-platform";

export interface RateLimitRecommendation {
  endpoint: string;
  currentLimitPerHour: number;
  recommendedLimitPerHour: number;
  reason: string;
}

export function isRateLimitExceeded(
  usage: ApiUsage,
  rateLimit: ApiRateLimit,
  hoursInPeriod = 24,
): boolean {
  const hourlyAverage = usage.requestCount / hoursInPeriod;
  return hourlyAverage > rateLimit.limitPerHour;
}

export function getUsagePercent(usage: ApiUsage, rateLimit: ApiRateLimit): number {
  if (rateLimit.limitPerHour === 0) {
    return 0;
  }

  const hourlyEstimate = usage.requestCount / 24;
  return Math.round((hourlyEstimate / rateLimit.limitPerHour) * 100);
}

export function recommendRateLimit(
  usage: ApiUsage,
  rateLimit: ApiRateLimit,
): RateLimitRecommendation {
  const usagePercent = getUsagePercent(usage, rateLimit);
  const hourlyEstimate = Math.round(usage.requestCount / 24);

  if (usagePercent > 80) {
    return {
      endpoint: usage.endpoint,
      currentLimitPerHour: rateLimit.limitPerHour,
      recommendedLimitPerHour: Math.round(rateLimit.limitPerHour * 1.5),
      reason: `Usage at ${usagePercent}% of limit — consider increasing`,
    };
  }

  if (usagePercent < 20) {
    return {
      endpoint: usage.endpoint,
      currentLimitPerHour: rateLimit.limitPerHour,
      recommendedLimitPerHour: Math.max(hourlyEstimate * 2, 100),
      reason: `Low usage at ${usagePercent}% — current limit may be excessive`,
    };
  }

  return {
    endpoint: usage.endpoint,
    currentLimitPerHour: rateLimit.limitPerHour,
    recommendedLimitPerHour: rateLimit.limitPerHour,
    reason: `Usage at ${usagePercent}% — current limit is appropriate`,
  };
}

export function getUsageErrorRatePercent(usage: ApiUsage): number {
  if (usage.requestCount === 0) {
    return 0;
  }

  return Math.round((usage.errorCount / usage.requestCount) * 10000) / 100;
}

export function getAverageLatencyLabel(latencyMs: number): string {
  if (latencyMs < 100) {
    return "Excellent";
  }

  if (latencyMs < 300) {
    return "Good";
  }

  if (latencyMs < 1000) {
    return "Acceptable";
  }

  return "Slow";
}
