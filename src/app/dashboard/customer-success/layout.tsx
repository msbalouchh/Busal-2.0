import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { CustomerSuccessNav } from "@/modules/customer-success/components/customer-success-nav";

export const metadata: Metadata = {
  title: "Customer Success",
};

export default function CustomerSuccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Customer 360°, health scores, playbooks, renewals, expansion, and executive reviews."
      nav={<CustomerSuccessNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
