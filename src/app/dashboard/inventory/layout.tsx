import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { InventoryNav } from "@/modules/inventory/components/inventory-nav";

export const metadata: Metadata = {
  title: "Inventory",
};

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Manage ingredients, recipes, stock levels, and suppliers."
      nav={<InventoryNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
