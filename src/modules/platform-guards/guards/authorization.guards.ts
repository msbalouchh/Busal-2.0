import "server-only";

import {
  requireAllPermissions as requireAllAuthorizationPermissions,
  requireAnyPermission as requireAnyAuthorizationPermissions,
  requirePermission as requireAuthorizationPermission,
  requireRole as requireAuthorizationRole,
} from "@/modules/authorization/guards/permission-guards";
import type {
  AuthorizationContext,
  PermissionCode,
} from "@/modules/authorization/types/authorization";
import { mapToPlatformGuardError } from "@/modules/platform-guards/utils/error-mapper";
import {
  permissionDenied,
  roleRequired,
} from "@/modules/platform-guards/utils/platform-guard-errors";

export async function requireRole(roleSlug: string): Promise<AuthorizationContext> {
  try {
    const context = await requireAuthorizationRole(roleSlug);

    if (context.roleSlug !== roleSlug && !context.isOwner) {
      throw roleRequired();
    }

    return context;
  } catch (error) {
    throw mapToPlatformGuardError(error);
  }
}

export async function requirePermission(permission: PermissionCode): Promise<AuthorizationContext> {
  try {
    return await requireAuthorizationPermission(permission);
  } catch (error) {
    throw mapToPlatformGuardError(error);
  }
}

export async function requireAnyPermission(
  permissions: PermissionCode[],
): Promise<AuthorizationContext> {
  try {
    return await requireAnyAuthorizationPermissions(permissions);
  } catch (error) {
    throw mapToPlatformGuardError(error);
  }
}

export async function requireAllPermissions(
  permissions: PermissionCode[],
): Promise<AuthorizationContext> {
  try {
    return await requireAllAuthorizationPermissions(permissions);
  } catch (error) {
    throw mapToPlatformGuardError(error);
  }
}

export function assertPermission(context: AuthorizationContext, permission: PermissionCode): void {
  if (!context.permissions.has(permission) && !context.isOwner) {
    throw permissionDenied();
  }
}
