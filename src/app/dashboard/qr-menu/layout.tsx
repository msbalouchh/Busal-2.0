import type { ReactNode } from "react";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { DASHBOARD_MODULE_DESCRIPTIONS } from "@/modules/dashboard/constants/module-descriptions";

interface QRMenuLayoutProps {
  children: ReactNode;
}

export default function QRMenuLayout({ children }: QRMenuLayoutProps) {
  return (
    <DashboardSectionLayout description={DASHBOARD_MODULE_DESCRIPTIONS.qrMenu}>
      {children}
    </DashboardSectionLayout>
  );
}
