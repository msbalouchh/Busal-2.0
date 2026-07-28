import { SLOW_REQUEST_THRESHOLD_MS } from "@/modules/monitoring-platform/constants/routes";

export function isSlowRequest(durationMs: number, threshold = SLOW_REQUEST_THRESHOLD_MS): boolean {
  return durationMs >= threshold;
}

export function calculateAverageResponseTime(durations: number[]): number {
  if (durations.length === 0) {
    return 0;
  }

  return Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length);
}

export function buildPerformanceTrend(durations: number[]): {
  avgMs: number;
  p95Ms: number;
  slowCount: number;
} {
  if (durations.length === 0) {
    return { avgMs: 0, p95Ms: 0, slowCount: 0 };
  }

  const sorted = [...durations].sort((a, b) => a - b);
  const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));

  return {
    avgMs: calculateAverageResponseTime(durations),
    p95Ms: sorted[p95Index] ?? 0,
    slowCount: durations.filter((duration) => isSlowRequest(duration)).length,
  };
}
