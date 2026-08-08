import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TakePaymentPageClient } from "@/modules/payment-receipt-management/components/take-payment-page-client";
import { PAYMENT_RECEIPT_ROUTES } from "@/modules/payment-receipt-management/constants/routes";
import { getPaymentReceiptContext } from "@/modules/payment-receipt-management/lib/get-payment-receipt-context";
import { getOrderPaymentSummary } from "@/modules/payments/services/payment-platform.service";

interface TakePaymentPageProps {
  searchParams: Promise<{ branchId?: string; orderId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Take Payment" };
}

export default async function TakePaymentPage({ searchParams }: TakePaymentPageProps) {
  const params = await searchParams;
  const context = await getPaymentReceiptContext(params.branchId);

  if (!context.selectedBranchId || !params.orderId) {
    redirect(PAYMENT_RECEIPT_ROUTES.dashboard());
  }

  if (!context.permissionsFlags.canCreate) {
    redirect(PAYMENT_RECEIPT_ROUTES.dashboardForBranch(context.selectedBranchId));
  }

  const summary = await getOrderPaymentSummary(
    context.user.id,
    context.selectedBranchId,
    params.orderId,
  );

  return <TakePaymentPageClient branchId={context.selectedBranchId} summary={summary} />;
}
