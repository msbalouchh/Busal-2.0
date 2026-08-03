"use client";

import { useContext } from "react";

import { MenuContext } from "@/modules/menu/contexts/menu-context";
import type { MenuContextValue } from "@/modules/menu/types/menu";

export function useMenuContext(): MenuContextValue {
  const context = useContext(MenuContext);

  if (!context) {
    throw new Error("useMenuContext must be used within MenuProvider");
  }

  return context;
}

export function useMenu(): MenuContextValue {
  return useMenuContext();
}
