import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalInvoicesPanel } from "@/modules/customer-portal/components/customer-portal-invoices-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { listCustomerInvoices } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Invoices",
};

export default async function CustomerPortalInvoicesPage() {
  const context = await getCustomerPortalContext();
  const invoices = await listCustomerInvoices(context.business.id, context.customer.id);

  return (
    <PageContainer title="Invoices" description="View and download your invoices.">
      <CustomerPortalInvoicesPanel invoices={invoices} />
    </PageContainer>
  );
}
