"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { MenuContext } from "@/modules/menu/contexts/menu-context";
import { menuRepository } from "@/modules/menu/repository/menu-repository";
import {
  buildMenuPlatformContext,
  buildMenuPlatformSnapshot,
  type MenuPlatformInput,
} from "@/modules/menu/services/menu-platform.service";
import type { MenuContextValue, MenuSearchQuery } from "@/modules/menu/types/menu";

interface MenuProviderProps {
  children: ReactNode;
  initialInput?: MenuPlatformInput;
}

export function MenuProvider({ children, initialInput }: MenuProviderProps) {
  const [input] = useState<MenuPlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildMenuPlatformSnapshot(input));
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(buildMenuPlatformSnapshot(input));
  }, [input]);

  const value = useMemo<MenuContextValue>(() => {
    const context = buildMenuPlatformContext(input);
    const selectedMenu = selectedMenuId
      ? (snapshot.menus.find((menu) => menu.menu.id === selectedMenuId) ?? null)
      : null;
    const selectedItem = selectedItemId
      ? (menuRepository.findItemById(selectedItemId) ?? null)
      : null;

    return {
      context,
      menus: snapshot.menus,
      selectedMenu,
      selectedItem,
      selectMenu: setSelectedMenuId,
      selectItem: setSelectedItemId,
      searchItems: (query: MenuSearchQuery) =>
        menuRepository.searchItems({
          ...query,
          tenantId: query.tenantId ?? context.tenantId,
          businessId: query.businessId ?? context.businessId,
          branchId: query.branchId ?? context.branchId,
        }),
      refresh,
    };
  }, [input, snapshot, selectedMenuId, selectedItemId, refresh]);

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}
