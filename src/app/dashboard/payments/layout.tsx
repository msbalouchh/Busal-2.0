import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { DASHBOARD_MODULE_DESCRIPTIONS } from "@/modules/dashboard/constants/module-descriptions";

export const metadata: Metadata = {
  title: "Payments",
};

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout description={DASHBOARD_MODULE_DESCRIPTIONS.payments}>
      {children}
    </DashboardSectionLayout>
  );
}
