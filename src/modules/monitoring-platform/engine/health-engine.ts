import type { MonitoringHealthStatus } from "@prisma/client";

import type { RegisteredHealthCheckDefinition } from "@/modules/monitoring-platform/types/monitoring-platform-types";

export function evaluateHealthStatus(input: {
  targetType: string;
  lastError?: boolean;
  latencyMs?: number;
}): MonitoringHealthStatus {
  if (input.lastError) {
    return "UNHEALTHY";
  }

  if (input.latencyMs !== undefined && input.latencyMs > 2000) {
    return "DEGRADED";
  }

  if (input.targetType === "DATABASE" && input.latencyMs !== undefined && input.latencyMs > 500) {
    return "DEGRADED";
  }

  return "HEALTHY";
}

export function buildHealthEndpointResponse(
  checks: Array<{
    checkKey: string;
    name: string;
    targetType: RegisteredHealthCheckDefinition["targetType"];
    status: MonitoringHealthStatus;
  }>,
): { status: MonitoringHealthStatus; checks: typeof checks; timestamp: string } {
  const hasUnhealthy = checks.some((check) => check.status === "UNHEALTHY");
  const hasDegraded = checks.some((check) => check.status === "DEGRADED");

  let status: MonitoringHealthStatus = "HEALTHY";
  if (hasUnhealthy) {
    status = "UNHEALTHY";
  } else if (hasDegraded) {
    status = "DEGRADED";
  }

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
  };
}

export function resolveHealthEndpointPath(checkKey: string): string {
  return `/api/v1/monitoring/health/${checkKey}`;
}
