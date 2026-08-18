"use client";

import type { ReactNode } from "react";

import { PlatformBrandingProvider } from "@/modules/platform/providers/platform-branding-provider";
import { PlatformBrandingStyles } from "@/modules/platform/components/platform-branding-styles";
import type { ResolvedPlatformBranding } from "@/modules/platform/types/platform-config.types";
import { RbacProvider } from "@/modules/rbac/providers/rbac-provider";
import { TenantProvider } from "@/modules/tenant/providers/tenant-provider";
import type { RbacSnapshot } from "@/modules/rbac/types/context";
import type { TenantSnapshot } from "@/modules/tenant/types/context";

interface DashboardPlatformProvidersProps {
  children: ReactNode;
  tenantSnapshot: TenantSnapshot;
  rbacSnapshot: RbacSnapshot;
  branding: ResolvedPlatformBranding;
}

export function DashboardPlatformProviders({
  children,
  tenantSnapshot,
  rbacSnapshot,
  branding,
}: DashboardPlatformProvidersProps) {
  return (
    <PlatformBrandingProvider branding={branding}>
      <PlatformBrandingStyles branding={branding} />
      <TenantProvider initialSnapshot={tenantSnapshot}>
        <RbacProvider initialSnapshot={rbacSnapshot}>{children}</RbacProvider>
      </TenantProvider>
    </PlatformBrandingProvider>
  );
}
