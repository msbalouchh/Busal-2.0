import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { DASHBOARD_MODULE_DESCRIPTIONS } from "@/modules/dashboard/constants/module-descriptions";
import { MenuNav } from "@/modules/menu/components/menu-nav";

interface MenuLayoutProps {
  children: ReactNode;
}

export default function MenuLayout({ children }: MenuLayoutProps) {
  return (
    <DashboardSectionLayout
      description={DASHBOARD_MODULE_DESCRIPTIONS.menu}
      nav={<MenuNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
