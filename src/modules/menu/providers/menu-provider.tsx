"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { MenuContext } from "@/modules/menu/contexts/menu-context";
import {
  buildMenuPlatformContext,
  type MenuPlatformInput,
  type MenuPlatformSnapshot,
} from "@/modules/menu/services/menu-platform.service";
import type { MenuContextValue, MenuItemRecord, MenuSearchQuery } from "@/modules/menu/types/menu";

interface MenuProviderProps {
  children: ReactNode;
  initialInput?: MenuPlatformInput;
  initialSnapshot?: MenuPlatformSnapshot;
}

export function MenuProvider({ children, initialInput, initialSnapshot }: MenuProviderProps) {
  const [input] = useState<MenuPlatformInput>(
    () => initialInput ?? { businessId: initialSnapshot?.context.businessId ?? "" },
  );
  const [snapshot, setSnapshot] = useState<MenuPlatformSnapshot | null>(initialSnapshot ?? null);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void fetch("/api/menu/items?pageSize=100")
      .then((response) => response.json())
      .then(
        (payload: {
          success: boolean;
          data?: { records: MenuItemRecord[]; menus?: MenuPlatformSnapshot["menus"] };
        }) => {
          if (!payload.success || !payload.data) {
            return;
          }

          setSnapshot((current) =>
            current
              ? {
                  ...current,
                  menus: payload.data!.menus ?? current.menus,
                  itemCount: payload.data!.records.length,
                }
              : null,
          );
        },
      )
      .catch(() => undefined);
  }, []);

  const value = useMemo<MenuContextValue>(() => {
    const context = snapshot?.context ?? buildMenuPlatformContext(input);
    const menus = snapshot?.menus ?? [];
    const allItems = menus.flatMap((menu) => menu.items);
    const selectedMenu = selectedMenuId
      ? (menus.find((menu) => menu.menu.id === selectedMenuId) ?? null)
      : null;
    const selectedItem = selectedItemId
      ? (allItems.find((item) => item.item.id === selectedItemId) ?? null)
      : null;

    return {
      context,
      menus,
      selectedMenu,
      selectedItem,
      selectMenu: setSelectedMenuId,
      selectItem: setSelectedItemId,
      searchItems: (query: MenuSearchQuery) => {
        let results = allItems;

        if (query.menuId) {
          results = results.filter((record) => record.item.menuId === query.menuId);
        }

        if (query.status) {
          results = results.filter((record) => record.item.status === query.status);
        }

        if (query.query) {
          const normalized = query.query.toLowerCase();
          results = results.filter((record) =>
            [record.item.name, record.item.description ?? "", record.item.sku]
              .join(" ")
              .toLowerCase()
              .includes(normalized),
          );
        }

        const limit = query.limit ?? query.pageSize ?? results.length;
        return results.slice(0, limit);
      },
      refresh,
    };
  }, [input, snapshot, selectedMenuId, selectedItemId, refresh]);

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}
