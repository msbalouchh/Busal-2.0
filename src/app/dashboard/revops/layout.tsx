import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { RevopsNav } from "@/modules/revops/components/revops-nav";

export const metadata: Metadata = {
  title: "Revenue Operations",
};

export default function RevopsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Invoices, payments, recognition, profitability, forecasting, and collections."
      nav={<RevopsNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
