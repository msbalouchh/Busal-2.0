import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { DASHBOARD_MODULE_DESCRIPTIONS } from "@/modules/dashboard/constants/module-descriptions";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";

export const metadata: Metadata = {
  title: "Inventory",
};

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description={DASHBOARD_MODULE_DESCRIPTIONS.inventory}
      nav={<InventoryNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
