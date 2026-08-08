import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { DASHBOARD_MODULE_DESCRIPTIONS } from "@/modules/dashboard/constants/module-descriptions";
import { StaffNav } from "@/modules/staff/components/staff-nav";

interface StaffLayoutProps {
  children: ReactNode;
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  return (
    <DashboardSectionLayout
      description={DASHBOARD_MODULE_DESCRIPTIONS.staff}
      nav={<StaffNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
