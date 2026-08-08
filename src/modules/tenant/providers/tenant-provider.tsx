"use client";

import type { ReactNode } from "react";

import { TenantFoundationProvider } from "@/modules/tenant/providers/tenant-foundation-provider";
import type { TenantSnapshot } from "@/modules/tenant/types/context";

interface TenantProviderProps {
  children: ReactNode;
  initialSnapshot: TenantSnapshot;
}

/**
 * Root multi-tenant provider.
 * Mounts organization, workspace, business, and branch context slices.
 */
export function TenantProvider({ children, initialSnapshot }: TenantProviderProps) {
  return (
    <TenantFoundationProvider initialSnapshot={initialSnapshot}>
      {children}
    </TenantFoundationProvider>
  );
}
