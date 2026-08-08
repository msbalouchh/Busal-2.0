import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { DASHBOARD_MODULE_DESCRIPTIONS } from "@/modules/dashboard/constants/module-descriptions";

export const metadata: Metadata = {
  title: "Point of Sale",
};

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout description={DASHBOARD_MODULE_DESCRIPTIONS.pos}>
      {children}
    </DashboardSectionLayout>
  );
}
