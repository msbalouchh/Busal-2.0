import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { OrderDetailsPanel } from "@/modules/order-management/components/order-details-panel";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order-management/constants/routes";
import { getOrderDetailsContext } from "@/modules/order-management/lib/get-order-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface OrderDetailsPageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Order Details" };
}

export default async function OrderDetailsPage({ params, searchParams }: OrderDetailsPageProps) {
  const { orderId } = await params;
  const query = await searchParams;
  const context = await getOrderDetailsContext(query.branchId ?? "", orderId);

  return (
    <ApplicationPageTemplate
      title={context.order.orderNumber}
      description={`${context.order.orderType.replace("_", " ").toLowerCase()} · ${context.order.items.length} items`}
      icon={ClipboardList}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        {
          label: "Orders",
          href: ORDER_MANAGEMENT_ROUTES.listForBranch(context.selectedBranchId ?? ""),
        },
        { label: context.order.orderNumber },
      ]}
    >
      <OrderDetailsPanel
        branchId={context.selectedBranchId ?? ""}
        order={context.order}
        permissionsFlags={context.permissionsFlags}
        tables={context.tables}
        mergeCandidates={context.mergeCandidates}
      />
    </ApplicationPageTemplate>
  );
}
