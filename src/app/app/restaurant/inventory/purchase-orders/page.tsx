import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { PurchaseOrderListPanel } from "@/modules/inventory-supplier-management/components/purchase-order-list-panel";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import { getPurchaseOrderListContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import type { PurchaseOrderStatus } from "@prisma/client";

interface PurchaseOrdersPageProps {
  searchParams: Promise<{ branchId?: string; search?: string; status?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Purchase Orders" };
}

export default async function PurchaseOrdersPage({ searchParams }: PurchaseOrdersPageProps) {
  const params = await searchParams;
  const context = await getPurchaseOrderListContext(params.branchId ?? "", {
    search: params.search,
    status: (params.status as PurchaseOrderStatus | "ALL") ?? "ALL",
  });

  return (
    <ApplicationPageTemplate
      title="Purchase orders"
      description="Create, send, and receive supplier purchase orders."
      icon={ClipboardList}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Inventory", href: INVENTORY_SUPPLIER_ROUTES.dashboard() },
        { label: "Purchase orders" },
      ]}
    >
      <PurchaseOrderListPanel
        context={context}
        list={context.list}
        initialSearch={params.search ?? ""}
        initialStatus={params.status ?? "ALL"}
      />
    </ApplicationPageTemplate>
  );
}
