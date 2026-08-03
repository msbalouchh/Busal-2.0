"use client";

import { useContext } from "react";

import { TenantContext } from "@/modules/tenant/contexts/tenant-context";
import type { TenantContextValue } from "@/modules/tenant/types/context";

export function useTenantContext(): TenantContextValue {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }

  return context;
}

export function useTenant(): TenantContextValue {
  return useTenantContext();
}
