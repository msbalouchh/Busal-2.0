import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import type { PermissionCode } from "@/modules/authorization/types/authorization";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "@/modules/authorization/utils/permission-utils";
import type { DashboardNavGroup, DashboardNavItem } from "@/modules/dashboard/types/dashboard";

interface NavigationFilterContext {
  permissions: PermissionCode[];
  featureFlags: Record<string, boolean>;
  isOwner: boolean;
}

function isFeatureEnabled(
  featureFlags: Record<string, boolean>,
  featureFlag: string | undefined,
): boolean {
  if (!featureFlag) {
    return true;
  }

  return featureFlags[featureFlag] ?? true;
}

function canAccessItem(item: DashboardNavItem, context: NavigationFilterContext): boolean {
  if (item.ownerOnly && !context.isOwner) {
    return false;
  }

  if (
    item.tenantAdmin &&
    !hasPermission(context.permissions, PERMISSION_CODES.TENANT_PLATFORM_VIEW)
  ) {
    return false;
  }

  if (item.permission && !hasPermission(context.permissions, item.permission)) {
    return false;
  }

  if (item.permissions?.length) {
    const allowed = item.requireAllPermissions
      ? hasAllPermissions(context.permissions, item.permissions)
      : hasAnyPermission(context.permissions, item.permissions);

    if (!allowed) {
      return false;
    }
  }

  if (!isFeatureEnabled(context.featureFlags, item.featureFlag)) {
    return false;
  }

  return true;
}

function filterNavItem(
  item: DashboardNavItem,
  context: NavigationFilterContext,
): DashboardNavItem | null {
  const children = item.children
    ?.map((child) => filterNavItem(child, context))
    .filter((child): child is DashboardNavItem => child !== null);

  const hasAccessibleChildren = Boolean(children?.length);
  const selfAccessible = canAccessItem(item, context);

  if (!selfAccessible && !hasAccessibleChildren) {
    return null;
  }

  if (!selfAccessible && hasAccessibleChildren) {
    return {
      ...item,
      href: undefined,
      children,
    };
  }

  return {
    ...item,
    children,
  };
}

export function filterDashboardNavigation(
  groups: DashboardNavGroup[],
  context: NavigationFilterContext,
): DashboardNavGroup[] {
  return groups
    .map((group) => {
      const items = group.items
        .map((item) => filterNavItem(item, context))
        .filter((item): item is DashboardNavItem => item !== null);

      if (items.length === 0) {
        return null;
      }

      return {
        ...group,
        items,
      };
    })
    .filter((group): group is DashboardNavGroup => group !== null);
}

export function filterByPermission<T extends { permission?: PermissionCode }>(
  items: T[],
  permissions: PermissionCode[],
): T[] {
  return items.filter((item) => !item.permission || hasPermission(permissions, item.permission));
}

export function filterByFeatureFlag<T extends { featureFlag?: string }>(
  items: T[],
  featureFlags: Record<string, boolean>,
): T[] {
  return items.filter((item) => isFeatureEnabled(featureFlags, item.featureFlag));
}
