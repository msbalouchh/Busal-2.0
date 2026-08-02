import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalPaymentsPanel } from "@/modules/customer-portal/components/customer-portal-payments-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { listCustomerPaymentMethods } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Payments",
};

export default async function CustomerPortalPaymentsPage() {
  const context = await getCustomerPortalContext();
  const payments = await listCustomerPaymentMethods(context.business.id, context.customer.id);

  return (
    <PageContainer title="Payments" description="Payment methods and recent transactions.">
      <CustomerPortalPaymentsPanel payments={payments} />
    </PageContainer>
  );
}
