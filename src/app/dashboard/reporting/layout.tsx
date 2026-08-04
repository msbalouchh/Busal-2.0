import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { ReportingNav } from "@/modules/reporting/components/reporting-nav";

export const metadata: Metadata = {
  title: "Reporting & Analytics",
};

export default function ReportingLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Sales, orders, inventory, and staff performance analytics."
      nav={<ReportingNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
