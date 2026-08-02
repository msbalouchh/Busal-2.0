import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { InventoryDetailsPanel } from "@/modules/inventory-supplier-management/components/inventory-details-panel";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import { getInventoryItemContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface InventoryItemPageProps {
  params: Promise<{ itemId: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Inventory Item" };
}

export default async function InventoryItemPage({ params, searchParams }: InventoryItemPageProps) {
  const { itemId } = await params;
  const query = await searchParams;
  const context = await getInventoryItemContext(query.branchId ?? "", itemId);

  return (
    <ApplicationPageTemplate
      title={context.item.name}
      description="Inventory item details, history, and stock adjustments."
      icon={PackageSearch}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Inventory", href: INVENTORY_SUPPLIER_ROUTES.dashboard() },
        { label: context.item.name },
      ]}
    >
      <InventoryDetailsPanel
        branchId={context.selectedBranchId!}
        item={context.item}
        history={context.history}
        permissionsFlags={context.permissionsFlags}
      />
    </ApplicationPageTemplate>
  );
}
