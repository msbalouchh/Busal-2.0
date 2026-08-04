import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { CrmNav } from "@/modules/crm/components/crm-nav";

export const metadata: Metadata = {
  title: "CRM",
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Manage customers, loyalty, rewards, and customer groups."
      nav={<CrmNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
