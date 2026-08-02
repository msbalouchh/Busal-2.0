import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CreatePurchaseOrderForm } from "@/modules/inventory-supplier-management/components/create-purchase-order-form";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import { getCreatePurchaseOrderContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface NewPurchaseOrderPageProps {
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "New Purchase Order" };
}

export default async function NewPurchaseOrderPage({ searchParams }: NewPurchaseOrderPageProps) {
  const params = await searchParams;
  const context = await getCreatePurchaseOrderContext(params.branchId ?? "");
  const branchId = context.selectedBranchId;

  if (!context.permissionsFlags.canCreatePurchaseOrder || !branchId) {
    redirect(INVENTORY_SUPPLIER_ROUTES.purchaseOrders());
  }

  return (
    <ApplicationPageTemplate
      title="Create purchase order"
      description="Order stock from a supplier for this branch."
      icon={Plus}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Inventory", href: INVENTORY_SUPPLIER_ROUTES.dashboard() },
        { label: "Purchase orders", href: INVENTORY_SUPPLIER_ROUTES.purchaseOrders(branchId) },
        { label: "New" },
      ]}
    >
      <CreatePurchaseOrderForm
        branchId={branchId}
        suppliers={context.suppliers}
        inventoryItems={context.inventoryItems}
      />
    </ApplicationPageTemplate>
  );
}
