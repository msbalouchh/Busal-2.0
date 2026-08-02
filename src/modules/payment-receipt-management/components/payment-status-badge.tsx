import type { OrderPaymentStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_LABELS } from "@/modules/payment-receipt-management/lib/payment-validation";

const VARIANTS: Record<OrderPaymentStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  PARTIALLY_PAID: "outline",
  PAID: "default",
  FAILED: "destructive",
  REFUNDED: "outline",
  VOIDED: "destructive",
};

interface PaymentStatusBadgeProps {
  status: OrderPaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return <Badge variant={VARIANTS[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}
