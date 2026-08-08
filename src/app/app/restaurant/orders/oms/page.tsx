import type { Metadata } from "next";

import { OrderManagementOverview } from "@/modules/orders/components/order-management-overview";
import { getOrderModuleContext } from "@/modules/orders/lib/get-order-context";
import { OrdersProvider } from "@/modules/orders/providers/orders-provider";

export const metadata: Metadata = {
  title: "Order Management",
};

export default async function OrderManagementPage() {
  const { snapshot, platformContext } = await getOrderModuleContext();

  return (
    <OrdersProvider initialInput={platformContext} initialSnapshot={snapshot}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground text-sm">
            Production OMS for dine-in, takeaway, delivery, and QR orders with kitchen and payment
            tracking.
          </p>
        </div>
        <OrderManagementOverview initialSnapshot={snapshot} />
      </div>
    </OrdersProvider>
  );
}
