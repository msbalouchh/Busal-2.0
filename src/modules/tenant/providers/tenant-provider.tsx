"use client";

import type { ReactNode } from "react";

import { TenantFoundationProvider } from "@/modules/tenant/providers/tenant-foundation-provider";
import type { TenantSelection } from "@/modules/tenant/types/entities";

interface TenantProviderProps {
  children: ReactNode;
  initialSelection?: TenantSelection;
}

/**
 * Root multi-tenant provider.
 * Mounts organization, workspace, business, and branch context slices.
 */
export function TenantProvider({ children, initialSelection }: TenantProviderProps) {
  return (
    <TenantFoundationProvider initialSelection={initialSelection}>
      {children}
    </TenantFoundationProvider>
  );
}
