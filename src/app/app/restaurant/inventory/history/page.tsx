import type { Metadata } from "next";
import { History } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { InventoryHistoryPanel } from "@/modules/inventory-supplier-management/components/inventory-history-panel";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import { getInventoryHistoryContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface InventoryHistoryPageProps {
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Inventory History" };
}

export default async function InventoryHistoryPage({ searchParams }: InventoryHistoryPageProps) {
  const params = await searchParams;
  const context = await getInventoryHistoryContext(params.branchId ?? "", {
    branchId: params.branchId ?? "",
  });

  if (!context.selectedBranchId) redirect(INVENTORY_SUPPLIER_ROUTES.dashboard());

  return (
    <ApplicationPageTemplate
      title="Inventory history"
      description="Stock movements, adjustments, purchases, and transfers."
      icon={History}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Inventory", href: INVENTORY_SUPPLIER_ROUTES.dashboard() },
        { label: "History" },
      ]}
    >
      <InventoryHistoryPanel history={context.history} />
    </ApplicationPageTemplate>
  );
}
