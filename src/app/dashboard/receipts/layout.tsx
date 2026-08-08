import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { DASHBOARD_MODULE_DESCRIPTIONS } from "@/modules/dashboard/constants/module-descriptions";

export const metadata: Metadata = {
  title: "Receipts",
};

export default function ReceiptsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout description={DASHBOARD_MODULE_DESCRIPTIONS.receipts}>
      {children}
    </DashboardSectionLayout>
  );
}
