import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { MarketplaceNav } from "@/modules/marketplace/components/marketplace-nav";

export const metadata: Metadata = {
  title: "Marketplace",
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Discover, install, and manage extensions that expand Busal OS."
      nav={<MarketplaceNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
