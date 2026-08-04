import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { MarketplacePlatformNav } from "@/modules/marketplace-platform/components/marketplace-platform-nav";

interface MarketplacePlatformLayoutProps {
  children: ReactNode;
}

export default function MarketplacePlatformLayout({ children }: MarketplacePlatformLayoutProps) {
  return (
    <DashboardSectionLayout
      description="Marketplace platform for extensions, integrations, and partner apps."
      nav={<MarketplacePlatformNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
