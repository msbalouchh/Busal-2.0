import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalOrdersPanel } from "@/modules/customer-portal/components/customer-portal-orders-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { listCustomerOrders } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Orders",
};

export default async function CustomerPortalOrdersPage() {
  const context = await getCustomerPortalContext();
  const orders = await listCustomerOrders(context.business.id, context.customer.id);

  return (
    <PageContainer title="Orders" description="View your order history.">
      <CustomerPortalOrdersPanel orders={orders} />
    </PageContainer>
  );
}
