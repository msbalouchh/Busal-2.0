import type {
  TenantHealthStatus,
  TenantLifecycleStatus,
  TenantMaintenanceMode,
} from "@prisma/client";

import { isMaintenanceActive } from "@/modules/tenant-platform/engine/maintenance-engine";

export function evaluateTenantHealth(input: {
  lifecycleStatus: TenantLifecycleStatus;
  maintenanceMode: TenantMaintenanceMode;
  usageBreaches: number;
}): TenantHealthStatus {
  if (input.lifecycleStatus === "SUSPENDED" || input.lifecycleStatus === "DELETED") {
    return "CRITICAL";
  }

  if (input.lifecycleStatus === "PENDING" || input.lifecycleStatus === "ARCHIVED") {
    return "DEGRADED";
  }

  if (isMaintenanceActive(input.maintenanceMode) || input.usageBreaches >= 3) {
    return "CRITICAL";
  }

  if (input.usageBreaches >= 1) {
    return "DEGRADED";
  }

  return "HEALTHY";
}

export function buildHealthChecks(input: {
  lifecycleStatus: TenantLifecycleStatus;
  maintenanceMode: TenantMaintenanceMode;
  storageUsagePct: number;
  apiUsagePct: number;
}): Array<{ name: string; status: string; message: string }> {
  const checks: Array<{ name: string; status: string; message: string }> = [];

  checks.push({
    name: "Lifecycle",
    status: input.lifecycleStatus === "ACTIVE" ? "PASS" : "FAIL",
    message: `Tenant is ${input.lifecycleStatus.toLowerCase()}`,
  });

  checks.push({
    name: "Maintenance",
    status: isMaintenanceActive(input.maintenanceMode) ? "WARN" : "PASS",
    message: isMaintenanceActive(input.maintenanceMode)
      ? `Maintenance mode: ${input.maintenanceMode.toLowerCase()}`
      : "Operational",
  });

  checks.push({
    name: "Storage",
    status: input.storageUsagePct >= 90 ? "FAIL" : input.storageUsagePct >= 75 ? "WARN" : "PASS",
    message: `Storage at ${input.storageUsagePct}%`,
  });

  checks.push({
    name: "API",
    status: input.apiUsagePct >= 90 ? "FAIL" : input.apiUsagePct >= 75 ? "WARN" : "PASS",
    message: `API usage at ${input.apiUsagePct}%`,
  });

  return checks;
}
