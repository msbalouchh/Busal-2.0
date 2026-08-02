import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PAYMENT_RECEIPT_ROUTES } from "@/modules/payment-receipt-management/constants/routes";

export const metadata: Metadata = {
  title: "Receipt",
};

interface PaymentReceiptRedirectPageProps {
  params: Promise<{ receiptId: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

export default async function PaymentReceiptRedirectPage({
  params,
  searchParams,
}: PaymentReceiptRedirectPageProps) {
  const { receiptId } = await params;
  const { branchId } = await searchParams;
  redirect(PAYMENT_RECEIPT_ROUTES.receipt(receiptId, branchId ?? ""));
}
