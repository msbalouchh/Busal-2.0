"use client";

import { useContext } from "react";

import { InventoryContext } from "@/modules/inventory/contexts/inventory-context";
import type { InventoryContextValue } from "@/modules/inventory/types/inventory-platform";

export function useInventoryContext(): InventoryContextValue {
  const context = useContext(InventoryContext);

  if (!context) {
    throw new Error("useInventoryContext must be used within InventoryProvider");
  }

  return context;
}

export function useInventory(): InventoryContextValue {
  return useInventoryContext();
}
