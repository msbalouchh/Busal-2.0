"use client";

import { useContext } from "react";

import { TenantFoundationContext } from "@/modules/tenant/contexts/tenant-foundation-context";
import type { TenantFoundationContextValue } from "@/modules/tenant/types/context";

export function useTenantFoundation(): TenantFoundationContextValue {
  const context = useContext(TenantFoundationContext);

  if (!context) {
    throw new Error("useTenantFoundation must be used within TenantProvider");
  }

  return context;
}
