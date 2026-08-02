import type { Metadata } from "next";
import { Pencil } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EditInventoryItemForm } from "@/modules/inventory-supplier-management/components/edit-inventory-item-form";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import { getInventoryItemContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface EditInventoryItemPageProps {
  params: Promise<{ itemId: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Edit Inventory Item" };
}

export default async function EditInventoryItemPage({
  params,
  searchParams,
}: EditInventoryItemPageProps) {
  const { itemId } = await params;
  const query = await searchParams;
  const context = await getInventoryItemContext(query.branchId ?? "", itemId);

  if (!context.permissionsFlags.canUpdateInventory || !context.selectedBranchId) {
    redirect(INVENTORY_SUPPLIER_ROUTES.item(itemId, context.selectedBranchId ?? ""));
  }

  return (
    <ApplicationPageTemplate
      title="Edit inventory item"
      description="Update stock item configuration."
      icon={Pencil}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Inventory", href: INVENTORY_SUPPLIER_ROUTES.dashboard() },
        {
          label: context.item.name,
          href: INVENTORY_SUPPLIER_ROUTES.item(itemId, context.selectedBranchId),
        },
        { label: "Edit" },
      ]}
    >
      <EditInventoryItemForm branchId={context.selectedBranchId} item={context.item} />
    </ApplicationPageTemplate>
  );
}
