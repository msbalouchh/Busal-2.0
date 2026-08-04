"use client";

import { useContext } from "react";

import { KitchenContext } from "@/modules/kitchen/contexts/kitchen-context";
import type { KitchenContextValue } from "@/modules/kitchen/types/kitchen";

export function useKitchenContext(): KitchenContextValue {
  const context = useContext(KitchenContext);

  if (!context) {
    throw new Error("useKitchenContext must be used within KitchenProvider");
  }

  return context;
}

export function useKitchen(): KitchenContextValue {
  return useKitchenContext();
}
