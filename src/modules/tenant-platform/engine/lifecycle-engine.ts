import type { TenantLifecycleStatus } from "@prisma/client";

export function canActivateTenant(status: TenantLifecycleStatus): boolean {
  return status === "PENDING";
}

export function canSuspendTenant(status: TenantLifecycleStatus): boolean {
  return status === "ACTIVE";
}

export function canReactivateTenant(status: TenantLifecycleStatus): boolean {
  return status === "SUSPENDED";
}

export function canArchiveTenant(status: TenantLifecycleStatus): boolean {
  return status === "ACTIVE" || status === "SUSPENDED";
}

export function canDeleteTenant(status: TenantLifecycleStatus): boolean {
  return status === "ARCHIVED" || status === "SUSPENDED";
}

export function resolveLifecycleTransition(
  action: "activate" | "suspend" | "reactivate" | "archive" | "delete",
  currentStatus: TenantLifecycleStatus,
): TenantLifecycleStatus | null {
  switch (action) {
    case "activate":
      return canActivateTenant(currentStatus) ? "ACTIVE" : null;
    case "suspend":
      return canSuspendTenant(currentStatus) ? "SUSPENDED" : null;
    case "reactivate":
      return canReactivateTenant(currentStatus) ? "ACTIVE" : null;
    case "archive":
      return canArchiveTenant(currentStatus) ? "ARCHIVED" : null;
    case "delete":
      return canDeleteTenant(currentStatus) ? "DELETED" : null;
    default:
      return null;
  }
}

export function isTenantOperational(status: TenantLifecycleStatus): boolean {
  return status === "ACTIVE";
}
