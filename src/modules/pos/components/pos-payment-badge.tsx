import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { POS_PAYMENT_TYPE_LABELS, type PosPaymentType } from "@/modules/pos/constants/pos-status";

interface PosPaymentBadgeProps {
  paymentType: PosPaymentType;
  className?: string;
}

export function PosPaymentBadge({ paymentType, className }: PosPaymentBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal", className)}>
      {POS_PAYMENT_TYPE_LABELS[paymentType]}
    </Badge>
  );
}
