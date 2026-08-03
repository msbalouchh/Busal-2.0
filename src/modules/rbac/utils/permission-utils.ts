import type { PermissionKey } from "@/modules/rbac/types/permission";
import type { RbacEngineContext } from "@/modules/rbac/types/context";

export function normalizePermissionKeys(
  permissions: Iterable<PermissionKey>,
): ReadonlySet<PermissionKey> {
  return new Set(permissions);
}

export function hasPermission(
  context: Pick<RbacEngineContext, "permissionKeys" | "isOwner">,
  permission: PermissionKey,
): boolean {
  if (context.isOwner) {
    return true;
  }

  return context.permissionKeys.has(permission);
}

export function hasAnyPermission(
  context: Pick<RbacEngineContext, "permissionKeys" | "isOwner">,
  permissions: PermissionKey[],
): boolean {
  if (context.isOwner) {
    return true;
  }

  return permissions.some((permission) => context.permissionKeys.has(permission));
}

export function hasAllPermissions(
  context: Pick<RbacEngineContext, "permissionKeys" | "isOwner">,
  permissions: PermissionKey[],
): boolean {
  if (context.isOwner) {
    return true;
  }

  return permissions.every((permission) => context.permissionKeys.has(permission));
}

export function hasAnyPermissionPrefix(
  context: Pick<RbacEngineContext, "permissionKeys" | "isOwner">,
  prefix: string,
): boolean {
  if (context.isOwner) {
    return true;
  }

  for (const permission of context.permissionKeys) {
    if (permission.startsWith(`${prefix}.`)) {
      return true;
    }
  }

  return false;
}
