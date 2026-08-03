"use client";

import type { PermissionKey } from "@/modules/rbac/types/permission";
import { useRbac } from "@/modules/rbac/hooks/use-rbac";

export function usePermission(permission: PermissionKey): boolean {
  const { hasPermission } = useRbac();
  return hasPermission(permission);
}

export function useAnyPermission(permissions: PermissionKey[]): boolean {
  const { hasAnyPermission } = useRbac();
  return hasAnyPermission(permissions);
}

export function useAllPermissions(permissions: PermissionKey[]): boolean {
  const { hasAllPermissions } = useRbac();
  return hasAllPermissions(permissions);
}

export function useCanAccessRoute(route: string): boolean {
  const { canAccessRoute } = useRbac();
  return canAccessRoute(route);
}

export function useCanAccessModule(module: string): boolean {
  const { canAccessModule } = useRbac();
  return canAccessModule(module);
}

export function useCanAccessBranch(branchId: string): boolean {
  const { canAccessBranch } = useRbac();
  return canAccessBranch(branchId);
}

export function useCanManageUser(targetUserId: string): boolean {
  const { canManageUser } = useRbac();
  return canManageUser(targetUserId);
}
