import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { CommercialPlatformNav } from "@/modules/commercial-platform/components/commercial-platform-nav";

interface CommercialPlatformLayoutProps {
  children: ReactNode;
}

export default function CommercialPlatformLayout({ children }: CommercialPlatformLayoutProps) {
  return (
    <DashboardSectionLayout
      description="Enterprise commercial platform for pricing, catalogues, and revenue operations."
      nav={<CommercialPlatformNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
