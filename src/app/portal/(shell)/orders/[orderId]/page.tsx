import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalOrderDetailPanel } from "@/modules/customer-portal/components/customer-portal-order-detail-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { CustomerPortalError, getCustomerOrderDetail } from "@/services/customer-portal.service";

interface CustomerPortalOrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Order Details" };
}

export default async function CustomerPortalOrderDetailPage({
  params,
}: CustomerPortalOrderDetailPageProps) {
  const context = await getCustomerPortalContext();
  const { orderId } = await params;

  try {
    const order = await getCustomerOrderDetail(context.business.id, context.customer.id, orderId);

    return (
      <PageContainer
        title={`Order ${order.orderNumber}`}
        description="Order details and payment history."
      >
        <CustomerPortalOrderDetailPanel order={order} />
      </PageContainer>
    );
  } catch (error) {
    if (error instanceof CustomerPortalError) {
      notFound();
    }
    throw error;
  }
}
