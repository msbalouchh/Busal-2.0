import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { TenantPlatformNav } from "@/modules/tenant-platform/components/tenant-platform-nav";

export const metadata: Metadata = {
  title: "Tenant Administration",
};

export default function TenantPlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Central tenant management for lifecycle, resources, security, and analytics across Busal OS."
      nav={<TenantPlatformNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
