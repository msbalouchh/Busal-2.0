import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalInvoiceDetailPanel } from "@/modules/customer-portal/components/customer-portal-invoice-detail-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { CustomerPortalError, getCustomerInvoiceDetail } from "@/services/customer-portal.service";

interface CustomerPortalInvoiceDetailPageProps {
  params: Promise<{ invoiceId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Invoice Details" };
}

export default async function CustomerPortalInvoiceDetailPage({
  params,
}: CustomerPortalInvoiceDetailPageProps) {
  const context = await getCustomerPortalContext();
  const { invoiceId } = await params;

  try {
    const invoice = await getCustomerInvoiceDetail(
      context.business.id,
      context.customer.id,
      invoiceId,
    );

    return (
      <PageContainer
        title={`Invoice ${invoice.invoiceNumber}`}
        description="Invoice line items and payment summary."
      >
        <CustomerPortalInvoiceDetailPanel invoice={invoice} />
      </PageContainer>
    );
  } catch (error) {
    if (error instanceof CustomerPortalError) {
      notFound();
    }
    throw error;
  }
}
