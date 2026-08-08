"use client";

import type { ReactNode } from "react";

import { RbacProvider } from "@/modules/rbac/providers/rbac-provider";
import { TenantProvider } from "@/modules/tenant/providers/tenant-provider";
import type { RbacSnapshot } from "@/modules/rbac/types/context";
import type { TenantSnapshot } from "@/modules/tenant/types/context";

interface DashboardPlatformProvidersProps {
  children: ReactNode;
  tenantSnapshot: TenantSnapshot;
  rbacSnapshot: RbacSnapshot;
}

export function DashboardPlatformProviders({
  children,
  tenantSnapshot,
  rbacSnapshot,
}: DashboardPlatformProvidersProps) {
  return (
    <TenantProvider initialSnapshot={tenantSnapshot}>
      <RbacProvider initialSnapshot={rbacSnapshot}>{children}</RbacProvider>
    </TenantProvider>
  );
}
