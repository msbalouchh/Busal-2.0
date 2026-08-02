import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { PurchaseOrderDetailsPanel } from "@/modules/inventory-supplier-management/components/purchase-order-details-panel";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import { getPurchaseOrderDetailsContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface PurchaseOrderDetailsPageProps {
  params: Promise<{ purchaseOrderId: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Purchase Order" };
}

export default async function PurchaseOrderDetailsPage({
  params,
  searchParams,
}: PurchaseOrderDetailsPageProps) {
  const { purchaseOrderId } = await params;
  const query = await searchParams;
  const context = await getPurchaseOrderDetailsContext(query.branchId ?? "", purchaseOrderId);

  return (
    <ApplicationPageTemplate
      title={context.purchaseOrder.purchaseOrderNumber}
      description="Purchase order details, receiving, and status."
      icon={ClipboardList}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Inventory", href: INVENTORY_SUPPLIER_ROUTES.dashboard() },
        {
          label: "Purchase orders",
          href: INVENTORY_SUPPLIER_ROUTES.purchaseOrders(context.selectedBranchId ?? undefined),
        },
        { label: context.purchaseOrder.purchaseOrderNumber },
      ]}
    >
      <PurchaseOrderDetailsPanel
        branchId={context.selectedBranchId!}
        purchaseOrder={context.purchaseOrder}
        permissionsFlags={context.permissionsFlags}
      />
    </ApplicationPageTemplate>
  );
}
