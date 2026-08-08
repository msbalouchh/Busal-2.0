import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { RestaurantNav } from "@/modules/restaurant-operations/components/restaurant-nav";

import { DASHBOARD_MODULE_DESCRIPTIONS } from "@/modules/dashboard/constants/module-descriptions";

interface RestaurantLayoutProps {
  children: ReactNode;
}

export default function RestaurantLayout({ children }: RestaurantLayoutProps) {
  return (
    <DashboardSectionLayout
      description={DASHBOARD_MODULE_DESCRIPTIONS.restaurant}
      nav={<RestaurantNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
