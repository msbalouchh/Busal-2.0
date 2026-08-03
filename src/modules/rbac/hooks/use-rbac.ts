"use client";

import { useContext } from "react";

import { RbacContext } from "@/modules/rbac/contexts/rbac-context";
import type { RbacContextValue } from "@/modules/rbac/types/context";

export function useRbacContext(): RbacContextValue {
  const context = useContext(RbacContext);

  if (!context) {
    throw new Error("useRbacContext must be used within RbacProvider");
  }

  return context;
}

export function useRbac(): RbacContextValue {
  return useRbacContext();
}
