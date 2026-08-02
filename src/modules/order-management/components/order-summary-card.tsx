import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrderManagementRecord } from "@/modules/order-management/types/order-management-types";

interface OrderSummaryCardProps {
  order: OrderManagementRecord;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" }).format(value);
}

export function OrderSummaryCard({ order }: OrderSummaryCardProps) {
  const rows = [
    { label: "Subtotal", value: formatCurrency(order.subtotal) },
    { label: "Discount", value: `-${formatCurrency(order.discountAmount)}` },
    { label: "Tax", value: formatCurrency(order.taxAmount) },
    { label: "Service charge", value: formatCurrency(order.serviceCharge) },
    { label: "Delivery", value: formatCurrency(order.deliveryCharge) },
    { label: "Tip", value: formatCurrency(order.tipAmount) },
  ];

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Order summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span>{row.value}</span>
          </div>
        ))}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs capitalize">
            Payment: {order.paymentStatus.toLowerCase().replace("_", " ")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
