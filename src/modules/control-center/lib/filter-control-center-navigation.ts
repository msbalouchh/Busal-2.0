import { hasPermission } from "@/modules/authorization/utils/permission-utils";
import { getControlCenterNavigationRegistry } from "@/modules/control-center/constants/navigation";
import type {
  ControlCenterNavGroup,
  ControlCenterNavItem,
  ControlCenterQuickAction,
} from "@/modules/control-center/types/control-center-types";

function filterNavItem(
  item: ControlCenterNavItem,
  permissions: string[],
  featureFlags: Record<string, boolean>,
): ControlCenterNavItem | null {
  if (item.permission && !hasPermission(new Set(permissions), item.permission)) {
    return null;
  }

  if (item.featureFlag && !featureFlags[item.featureFlag]) {
    return null;
  }

  const children = item.children
    ?.map((child) => filterNavItem(child, permissions, featureFlags))
    .filter((child): child is ControlCenterNavItem => child != null);

  return {
    ...item,
    children: children?.length ? children : undefined,
  };
}

export function filterControlCenterNavigation(
  permissions: string[],
  featureFlags: Record<string, boolean> = {},
): ControlCenterNavGroup[] {
  return getControlCenterNavigationRegistry()
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => filterNavItem(item, permissions, featureFlags))
        .filter((item): item is ControlCenterNavItem => item != null),
    }))
    .filter((group) => group.items.length > 0);
}

export function filterControlCenterQuickActions(
  actions: ControlCenterQuickAction[],
  permissions: string[],
  featureFlags: Record<string, boolean> = {},
): ControlCenterQuickAction[] {
  return actions.filter((action) => {
    if (action.permission && !hasPermission(new Set(permissions), action.permission)) {
      return false;
    }

    if (action.featureFlag && !featureFlags[action.featureFlag]) {
      return false;
    }

    return true;
  });
}
