"use client";

import { useContext } from "react";

import { PosContext } from "@/modules/pos/contexts/pos-context";
import type { PosContextValue } from "@/modules/pos/types/pos-platform";

export function usePosContext(): PosContextValue {
  const context = useContext(PosContext);

  if (!context) {
    throw new Error("usePosContext must be used within PosProvider");
  }

  return context;
}

export function usePos(): PosContextValue {
  return usePosContext();
}
