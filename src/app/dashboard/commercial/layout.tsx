import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { CommercialNav } from "@/modules/commercial/components/commercial-nav";

export const metadata: Metadata = {
  title: "Commercial Catalogue",
};

export default function CommercialLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Product categories, commercial products, bundles, and price books."
      nav={<CommercialNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
