import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { POS_ORDER_STATUS_LABELS, type PosOrderStatus } from "@/modules/pos/constants/pos-status";

interface PosOrderStatusBadgeProps {
  status: PosOrderStatus;
  className?: string;
}

const STATUS_VARIANT: Record<PosOrderStatus, "default" | "secondary" | "outline" | "destructive"> =
  {
    draft: "outline",
    open: "default",
    held: "secondary",
    paid: "default",
    partially_paid: "secondary",
    refunded: "destructive",
    partially_refunded: "destructive",
    void: "destructive",
    merged: "outline",
    transferred: "outline",
  };

export function PosOrderStatusBadge({ status, className }: PosOrderStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {POS_ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
