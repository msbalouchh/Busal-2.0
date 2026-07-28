import type { TenantMaintenanceMode } from "@prisma/client";

export function isMaintenanceActive(mode: TenantMaintenanceMode): boolean {
  return mode !== "NONE";
}

export function isReadOnlyMaintenance(mode: TenantMaintenanceMode): boolean {
  return mode === "READ_ONLY";
}

export function isFullLockMaintenance(mode: TenantMaintenanceMode): boolean {
  return mode === "FULL_LOCK";
}

export function resolveEffectiveMaintenanceMode(
  mode: TenantMaintenanceMode,
  scheduledAt: Date | null | undefined,
  now: Date = new Date(),
): TenantMaintenanceMode {
  if (mode === "SCHEDULED" && scheduledAt && scheduledAt <= now) {
    return "FULL_LOCK";
  }

  return mode;
}

export function formatMaintenanceLabel(mode: TenantMaintenanceMode): string {
  switch (mode) {
    case "NONE":
      return "Operational";
    case "READ_ONLY":
      return "Read Only";
    case "FULL_LOCK":
      return "Full Lock";
    case "SCHEDULED":
      return "Scheduled";
    default:
      return mode;
  }
}
