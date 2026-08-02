import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EditOrderForm } from "@/modules/order-management/components/edit-order-form";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order-management/constants/routes";
import {
  getOrderDetailsContext,
  getOrderFormContext,
} from "@/modules/order-management/lib/get-order-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface EditOrderPageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Edit Order" };
}

export default async function EditOrderPage({ params, searchParams }: EditOrderPageProps) {
  const { orderId } = await params;
  const query = await searchParams;
  const context = await getOrderDetailsContext(query.branchId ?? "", orderId);
  const formContext = await getOrderFormContext(context.selectedBranchId ?? "");

  return (
    <ApplicationPageTemplate
      title={`Edit ${context.order.orderNumber}`}
      description="Update items, modifiers, and order adjustments."
      icon={ClipboardList}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        {
          label: "Orders",
          href: ORDER_MANAGEMENT_ROUTES.listForBranch(context.selectedBranchId ?? ""),
        },
        {
          label: context.order.orderNumber,
          href: ORDER_MANAGEMENT_ROUTES.details(orderId, context.selectedBranchId ?? ""),
        },
        { label: "Edit" },
      ]}
    >
      <EditOrderForm
        branchId={context.selectedBranchId ?? ""}
        order={context.order}
        products={formContext.products}
        tables={formContext.tables}
        staff={formContext.staff}
        customers={formContext.customers}
        disabled={!context.permissionsFlags.canUpdate}
      />
    </ApplicationPageTemplate>
  );
}
