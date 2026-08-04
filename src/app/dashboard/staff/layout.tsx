import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { StaffNav } from "@/modules/staff/components/staff-nav";

interface StaffLayoutProps {
  children: ReactNode;
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  return (
    <DashboardSectionLayout
      description="Manage staff directory, roles, schedules, and permissions."
      nav={<StaffNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
