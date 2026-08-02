import type {
  OrderPaymentRecord,
  OrderReceiptRecord,
} from "@/modules/payment-receipt-management/types/payment-receipt-types";
import { PAYMENT_METHOD_LABELS } from "@/modules/payment-receipt-management/lib/payment-validation";

interface ReceiptPrintLayoutProps {
  payment: OrderPaymentRecord;
  receipt: OrderReceiptRecord;
}

export function ReceiptPrintLayout({ payment, receipt }: ReceiptPrintLayoutProps) {
  return (
    <div className="mx-auto max-w-md rounded-xl border bg-white p-6 shadow-sm print:shadow-none">
      <div className="space-y-1 text-center">
        <p className="text-lg font-semibold">Receipt {receipt.receiptNumber}</p>
        <p className="text-muted-foreground text-sm">{payment.orderNumber}</p>
      </div>

      <div className="my-4 border-t border-dashed" />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>£{payment.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount</span>
          <span>£{payment.discountAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>£{payment.taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Service</span>
          <span>£{payment.serviceCharge.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tip</span>
          <span>£{payment.tipAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Paid</span>
          <span>£{payment.amountPaid.toFixed(2)}</span>
        </div>
        {payment.changeGiven > 0 ? (
          <div className="flex justify-between">
            <span>Change</span>
            <span>£{payment.changeGiven.toFixed(2)}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span>Method</span>
          <span>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</span>
        </div>
      </div>

      <p className="text-muted-foreground mt-4 text-center text-xs">
        Printed {receipt.printedCount} time{receipt.printedCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}
