import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { DASHBOARD_MODULE_DESCRIPTIONS } from "@/modules/dashboard/constants/module-descriptions";

interface ReservationsLayoutProps {
  children: ReactNode;
}

export default function ReservationsLayout({ children }: ReservationsLayoutProps) {
  return (
    <DashboardSectionLayout description={DASHBOARD_MODULE_DESCRIPTIONS.reservations}>
      {children}
    </DashboardSectionLayout>
  );
}
