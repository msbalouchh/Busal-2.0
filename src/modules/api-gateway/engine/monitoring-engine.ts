import type { ApiRequestLogView } from "@/modules/api-gateway/types/api-gateway-types";

export interface MonitoringSnapshot {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgResponseTimeMs: number;
  successRate: number;
  errorRate: number;
  byEndpoint: Record<string, number>;
  byClient: Record<string, number>;
}

export function buildMonitoringSnapshot(logs: ApiRequestLogView[]): MonitoringSnapshot {
  const totalRequests = logs.length;
  const successCount = logs.filter((log) => log.statusCode >= 200 && log.statusCode < 400).length;
  const errorCount = logs.filter((log) => log.statusCode >= 400).length;
  const avgResponseTimeMs =
    totalRequests === 0
      ? 0
      : Math.round(logs.reduce((sum, log) => sum + log.responseTimeMs, 0) / totalRequests);

  const byEndpoint: Record<string, number> = {};
  const byClient: Record<string, number> = {};

  for (const log of logs) {
    const endpoint = `${log.method} ${log.path}`;
    byEndpoint[endpoint] = (byEndpoint[endpoint] ?? 0) + 1;
  }

  return {
    totalRequests,
    successCount,
    errorCount,
    avgResponseTimeMs,
    successRate: totalRequests === 0 ? 0 : (successCount / totalRequests) * 100,
    errorRate: totalRequests === 0 ? 0 : (errorCount / totalRequests) * 100,
    byEndpoint,
    byClient,
  };
}
