import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CreateOrderForm } from "@/modules/order-management/components/create-order-form";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order-management/constants/routes";
import { getOrderFormContext } from "@/modules/order-management/lib/get-order-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface CreateOrderPageProps {
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Create Order" };
}

export default async function CreateOrderPage({ searchParams }: CreateOrderPageProps) {
  const params = await searchParams;
  const context = await getOrderFormContext(params.branchId ?? "");

  if (!context.selectedBranchId) {
    return (
      <ApplicationPageTemplate
        title="Create order"
        description="Select a branch before creating an order."
        icon={ClipboardList}
        breadcrumbs={[
          { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
          { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
          { label: "Orders", href: ORDER_MANAGEMENT_ROUTES.list() },
          { label: "Create" },
        ]}
      >
        <p className="text-muted-foreground text-sm">
          Select a branch from the orders dashboard first.
        </p>
      </ApplicationPageTemplate>
    );
  }

  return (
    <ApplicationPageTemplate
      title="Create order"
      description="Build a dine-in, takeaway, or delivery order with products and modifiers."
      icon={ClipboardList}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        {
          label: "Orders",
          href: ORDER_MANAGEMENT_ROUTES.listForBranch(context.selectedBranchId),
        },
        { label: "Create" },
      ]}
    >
      <CreateOrderForm
        branchId={context.selectedBranchId}
        products={context.products}
        tables={context.tables}
        staff={context.staff}
        customers={context.customers}
        disabled={!context.permissionsFlags.canCreate}
      />
    </ApplicationPageTemplate>
  );
}
