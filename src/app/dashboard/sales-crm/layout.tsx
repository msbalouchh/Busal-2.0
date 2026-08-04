import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { SalesCrmNav } from "@/modules/sales-crm/components/sales-crm-nav";

export const metadata: Metadata = {
  title: "Sales CRM",
};

export default function SalesCrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Leads, opportunities, pipeline stages, and commercial catalogue links."
      nav={<SalesCrmNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
