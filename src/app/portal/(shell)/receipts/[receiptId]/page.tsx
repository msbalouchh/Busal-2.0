import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/common/page-container";
import {
  CustomerPortalReceiptDetailPanel,
  type CustomerPortalReceiptDetail,
} from "@/modules/customer-portal/components/customer-portal-receipt-detail-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import {
  CustomerPortalError,
  getCustomerReceiptForDownload,
  listCustomerReceipts,
} from "@/services/customer-portal.service";

interface CustomerPortalReceiptDetailPageProps {
  params: Promise<{ receiptId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Receipt Details" };
}

export default async function CustomerPortalReceiptDetailPage({
  params,
}: CustomerPortalReceiptDetailPageProps) {
  const context = await getCustomerPortalContext();
  const { receiptId } = await params;

  try {
    const [receiptRecord, receipts] = await Promise.all([
      getCustomerReceiptForDownload(context.business.id, context.customer.id, receiptId),
      listCustomerReceipts(context.business.id, context.customer.id),
    ]);

    const summary = receipts.find((entry) => entry.id === receiptId);
    if (!summary) {
      notFound();
    }

    const receipt: CustomerPortalReceiptDetail = {
      id: receiptRecord.id,
      receiptNumber: receiptRecord.receiptNumber,
      orderNumber: summary.orderNumber,
      paymentNumber: summary.paymentNumber,
      amountFormatted: summary.amountFormatted,
      paidAt: summary.paidAt,
      items: receiptRecord.payment.order.items.map((item) => ({
        name: item.productNameSnapshot,
        quantity: item.quantity,
        total: Number(item.totalAmount),
      })),
    };

    return (
      <PageContainer
        title={`Receipt ${receipt.receiptNumber}`}
        description="Receipt details and download."
      >
        <CustomerPortalReceiptDetailPanel receipt={receipt} />
      </PageContainer>
    );
  } catch (error) {
    if (error instanceof CustomerPortalError) {
      notFound();
    }
    throw error;
  }
}
