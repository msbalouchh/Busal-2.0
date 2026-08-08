import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { DASHBOARD_MODULE_DESCRIPTIONS } from "@/modules/dashboard/constants/module-descriptions";
import { CrmNav } from "@/modules/crm/components/crm-nav";

export const metadata: Metadata = {
  title: "CRM",
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description={DASHBOARD_MODULE_DESCRIPTIONS.crm}
      nav={<CrmNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
