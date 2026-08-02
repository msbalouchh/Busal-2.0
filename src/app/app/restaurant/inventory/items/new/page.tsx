import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CreateInventoryItemForm } from "@/modules/inventory-supplier-management/components/create-inventory-item-form";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import { getInventorySupplierContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface NewInventoryItemPageProps {
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "New Inventory Item" };
}

export default async function NewInventoryItemPage({ searchParams }: NewInventoryItemPageProps) {
  const params = await searchParams;
  const context = await getInventorySupplierContext(params.branchId);
  const branchId = context.selectedBranchId;

  if (!context.permissionsFlags.canCreateInventory) {
    redirect(INVENTORY_SUPPLIER_ROUTES.dashboard());
  }
  if (!branchId) redirect(INVENTORY_SUPPLIER_ROUTES.dashboard());

  return (
    <ApplicationPageTemplate
      title="Create inventory item"
      description="Add a new stock item to this branch."
      icon={Plus}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Inventory", href: INVENTORY_SUPPLIER_ROUTES.dashboard() },
        { label: "New item" },
      ]}
    >
      <CreateInventoryItemForm branchId={branchId} />
    </ApplicationPageTemplate>
  );
}
