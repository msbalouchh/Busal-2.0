import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { MenuNav } from "@/modules/menu/components/menu-nav";

interface MenuLayoutProps {
  children: ReactNode;
}

export default function MenuLayout({ children }: MenuLayoutProps) {
  return (
    <DashboardSectionLayout
      description="Manage categories, menu items, modifiers, and pricing."
      nav={<MenuNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
