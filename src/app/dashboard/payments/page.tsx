import type { Metadata } from "next";

import { PaymentOrderList } from "@/modules/payments/components/payment-order-list";
import { getPaymentsModuleContext } from "@/modules/payments/lib/get-payment-context";

export const metadata: Metadata = {
  title: "Payments",
};

export default async function PaymentsPage() {
  const data = await getPaymentsModuleContext();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-muted-foreground text-sm">
          Complete POS orders with cash, card, split, or partial payments.
        </p>
      </div>
      <PaymentOrderList orders={data.unpaidOrders} />
    </div>
  );
}
