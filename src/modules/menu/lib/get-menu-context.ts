import { cache } from "react";

import { MENU_PERMISSIONS } from "@/modules/menu/constants/permissions";
import { resolveMenuScope, toMenuPlatformContext } from "@/modules/menu/lib/menu-scope";
import { menuRepository } from "@/modules/menu/repository/menu-repository";
import {
  recordsToUiContext,
  serializeModifierGroupForUi,
} from "@/modules/menu/utils/menu-ui-serializers";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";

export const getMenuModuleContext = cache(async () => {
  const context = await protectedPage({ permission: MENU_PERMISSIONS.MENU_READ });
  const scope = resolveMenuScope(context);
  const platformContext = toMenuPlatformContext(scope);

  const [menus, modifierGroupsRaw] = await Promise.all([
    menuRepository.listMenus(scope),
    menuRepository.listModifierGroups(scope),
  ]);

  const modifierGroups = modifierGroupsRaw.map(serializeModifierGroupForUi);
  const uiData = recordsToUiContext(menus, modifierGroups);

  return {
    user: context.user,
    business: context.business,
    platformContext,
    menus,
    ...uiData,
  };
});

export const getMenuPlatformSnapshotContext = cache(async () => {
  const context = await protectedPage({ permission: MENU_PERMISSIONS.MENU_READ });
  const scope = resolveMenuScope(context);
  const [menus, stats] = await Promise.all([
    menuRepository.listMenus(scope),
    menuRepository.getDashboardStats(scope),
  ]);

  return {
    context: toMenuPlatformContext(scope),
    menus,
    stats,
  };
});
