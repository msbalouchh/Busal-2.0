import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { DASHBOARD_MODULE_DESCRIPTIONS } from "@/modules/dashboard/constants/module-descriptions";
import { RevopsNav } from "@/modules/revops/components/revops-nav";

export const metadata: Metadata = {
  title: "Revenue Operations",
};

export default function RevopsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description={DASHBOARD_MODULE_DESCRIPTIONS.revops}
      nav={<RevopsNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
