import type {
  ControlCenterNavGroup,
  ControlCenterNavItem,
  ControlCenterQuickAction,
  ControlCenterWidgetDefinition,
} from "@/modules/control-center/types/control-center-types";
import {
  CONTROL_CENTER_NAV_GROUPS,
  CONTROL_CENTER_QUICK_ACTIONS,
  CONTROL_CENTER_WIDGETS,
} from "@/modules/control-center/constants/navigation-items";

export {
  CONTROL_CENTER_NAV_GROUPS,
  CONTROL_CENTER_QUICK_ACTIONS,
  CONTROL_CENTER_WIDGETS,
} from "@/modules/control-center/constants/navigation-items";

const pluginNavGroups: ControlCenterNavGroup[] = [];

export function registerControlCenterNavGroup(group: ControlCenterNavGroup): void {
  pluginNavGroups.push(group);
}

export function registerControlCenterNavItem(groupId: string, item: ControlCenterNavItem): void {
  const group = pluginNavGroups.find((entry) => entry.id === groupId);

  if (group) {
    group.items.push(item);
    return;
  }

  pluginNavGroups.push({
    id: groupId,
    name: groupId,
    items: [item],
    defaultOpen: false,
  });
}

export function getRegisteredControlCenterNavGroups(): ControlCenterNavGroup[] {
  return pluginNavGroups;
}

export function getControlCenterNavigationRegistry(): ControlCenterNavGroup[] {
  return [...CONTROL_CENTER_NAV_GROUPS, ...pluginNavGroups];
}

export function registerControlCenterWidget(widget: ControlCenterWidgetDefinition): void {
  CONTROL_CENTER_WIDGETS.push(widget);
}

export function registerControlCenterQuickAction(action: ControlCenterQuickAction): void {
  CONTROL_CENTER_QUICK_ACTIONS.push(action);
}
