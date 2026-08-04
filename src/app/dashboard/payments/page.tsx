import type { Metadata } from "next";

import { PaymentOrderList } from "@/modules/payments/components/payment-order-list";
import { getPaymentsModuleContext } from "@/modules/payments/lib/get-payment-context";

export const metadata: Metadata = {
  title: "Payments",
};

export default async function PaymentsPage() {
  const data = await getPaymentsModuleContext();

  return <PaymentOrderList orders={data.unpaidOrders} />;
}
