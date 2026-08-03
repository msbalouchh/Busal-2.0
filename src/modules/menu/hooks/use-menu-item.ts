"use client";

import { useMemo } from "react";

import { useMenuContext } from "@/modules/menu/hooks/use-menu";

export function useMenuItem(itemId: string | null) {
  const { menus, selectItem } = useMenuContext();

  const item = useMemo(() => {
    if (!itemId) return null;
    for (const menu of menus) {
      const found = menu.items.find((record) => record.item.id === itemId);
      if (found) return found;
    }
    return null;
  }, [menus, itemId]);

  return { item, selectItem };
}
