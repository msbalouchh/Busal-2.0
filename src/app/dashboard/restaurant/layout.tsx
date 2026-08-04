import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { RestaurantNav } from "@/modules/restaurant-operations/components/restaurant-nav";

interface RestaurantLayoutProps {
  children: ReactNode;
}

export default function RestaurantLayout({ children }: RestaurantLayoutProps) {
  return (
    <DashboardSectionLayout
      description="Restaurant operations, service modes, and floor management."
      nav={<RestaurantNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
