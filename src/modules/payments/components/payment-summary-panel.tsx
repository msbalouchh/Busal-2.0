import type { OrderPaymentSummaryView } from "@/modules/payments/types/payments";
import { formatPaymentMoney } from "@/modules/payments/utils/payment-utils";

interface PaymentSummaryPanelProps {
  summary: OrderPaymentSummaryView;
}

export function PaymentSummaryPanel({ summary }: PaymentSummaryPanelProps) {
  return (
    <section className="bg-card grid gap-4 rounded-xl border p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
      <div>
        <p className="text-muted-foreground text-xs tracking-wide uppercase">Amount Due</p>
        <p className="text-2xl font-semibold">{formatPaymentMoney(summary.orderTotal)}</p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs tracking-wide uppercase">Paid</p>
        <p className="text-2xl font-semibold">{formatPaymentMoney(summary.amountPaid)}</p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs tracking-wide uppercase">Remaining</p>
        <p className="text-2xl font-semibold">{formatPaymentMoney(summary.remainingBalance)}</p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs tracking-wide uppercase">Change</p>
        <p className="text-2xl font-semibold">{formatPaymentMoney(summary.changeDue)}</p>
      </div>
    </section>
  );
}
