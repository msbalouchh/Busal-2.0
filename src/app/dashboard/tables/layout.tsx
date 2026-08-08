import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { DASHBOARD_MODULE_DESCRIPTIONS } from "@/modules/dashboard/constants/module-descriptions";

interface TablesLayoutProps {
  children: ReactNode;
}

export default function TablesLayout({ children }: TablesLayoutProps) {
  return (
    <DashboardSectionLayout description={DASHBOARD_MODULE_DESCRIPTIONS.tables}>
      {children}
    </DashboardSectionLayout>
  );
}
