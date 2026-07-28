"use client";

import { useMemo } from "react";

import type { PermissionCode } from "@/modules/authorization/types/authorization";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "@/modules/authorization/utils/permission-utils";

export function useAuthorization(permissions: PermissionCode[]) {
  return useMemo(
    () => ({
      permissions,
      can: (permission: PermissionCode) => hasPermission(permissions, permission),
      canAny: (required: PermissionCode[]) => hasAnyPermission(permissions, required),
      canAll: (required: PermissionCode[]) => hasAllPermissions(permissions, required),
    }),
    [permissions],
  );
}
