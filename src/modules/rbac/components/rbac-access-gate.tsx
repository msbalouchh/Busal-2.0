"use client";

import type { ReactNode } from "react";

import type { PermissionKey } from "@/modules/rbac/types/permission";
import { useRbac } from "@/modules/rbac/hooks/use-rbac";

interface RbacAccessGateProps {
  permission?: PermissionKey;
  permissions?: PermissionKey[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RbacAccessGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: RbacAccessGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRbac();

  let allowed = true;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    allowed = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
