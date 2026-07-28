import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaymentScreen } from "@/modules/payments/components/payment-screen";
import { getPaymentOrderPageContext } from "@/modules/payments/lib/get-payment-context";

export const metadata: Metadata = {
  title: "Take Payment",
};

interface PaymentOrderPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function PaymentOrderPage({ params }: PaymentOrderPageProps) {
  const { orderId } = await params;

  try {
    const data = await getPaymentOrderPageContext(orderId);

    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PaymentScreen initialContext={data.paymentContext} />
      </div>
    );
  } catch {
    notFound();
  }
}
