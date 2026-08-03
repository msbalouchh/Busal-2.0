import {
  MODULE_PERMISSION_MAP,
  ROUTE_PERMISSION_MAP,
} from "@/modules/rbac/constants/module-access";
import type { PermissionKey } from "@/modules/rbac/types/permission";
import type { RbacEngineContext } from "@/modules/rbac/types/context";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasAnyPermissionPrefix,
  hasPermission,
} from "@/modules/rbac/utils/permission-utils";

function normalizeRoute(route: string): string {
  const withoutQuery = route.split("?")[0] ?? route;
  return withoutQuery.endsWith("/") && withoutQuery.length > 1
    ? withoutQuery.slice(0, -1)
    : withoutQuery;
}

function resolveRouteRequirement(route: string): PermissionKey | PermissionKey[] | null {
  const normalized = normalizeRoute(route);

  if (ROUTE_PERMISSION_MAP[normalized]) {
    return ROUTE_PERMISSION_MAP[normalized];
  }

  const segments = normalized.split("/").filter(Boolean);

  while (segments.length > 0) {
    const candidate = `/${segments.join("/")}`;

    if (ROUTE_PERMISSION_MAP[candidate]) {
      return ROUTE_PERMISSION_MAP[candidate];
    }

    segments.pop();
  }

  return null;
}

export function canAccessRoute(
  context: Pick<RbacEngineContext, "permissionKeys" | "isOwner">,
  route: string,
): boolean {
  const requirement = resolveRouteRequirement(route);

  if (!requirement) {
    return true;
  }

  if (Array.isArray(requirement)) {
    return hasAnyPermission(context, requirement);
  }

  return hasPermission(context, requirement);
}

export function canAccessModule(
  context: Pick<RbacEngineContext, "permissionKeys" | "isOwner">,
  module: string,
): boolean {
  const requirement = MODULE_PERMISSION_MAP[module];

  if (!requirement) {
    return hasAnyPermissionPrefix(context, module);
  }

  return hasPermission(context, requirement);
}

export function canAccessRoutes(
  context: Pick<RbacEngineContext, "permissionKeys" | "isOwner">,
  routes: string[],
  mode: "any" | "all" = "all",
): boolean {
  if (mode === "any") {
    return routes.some((route) => canAccessRoute(context, route));
  }

  return routes.every((route) => canAccessRoute(context, route));
}

export function resolveModuleRequirements(modules: string[]): PermissionKey[] {
  return modules
    .map((module) => MODULE_PERMISSION_MAP[module])
    .filter((permission): permission is PermissionKey => Boolean(permission));
}

export function canAccessModules(
  context: Pick<RbacEngineContext, "permissionKeys" | "isOwner">,
  modules: string[],
): boolean {
  const requirements = resolveModuleRequirements(modules);

  if (requirements.length === 0) {
    return modules.every((module) => canAccessModule(context, module));
  }

  return hasAllPermissions(context, requirements);
}
