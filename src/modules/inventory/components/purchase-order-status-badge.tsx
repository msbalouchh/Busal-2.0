import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PURCHASE_ORDER_STATUS_LABELS,
  type PurchaseOrderStatus,
} from "@/modules/inventory/constants/inventory-status";

interface PurchaseOrderStatusBadgeProps {
  status: PurchaseOrderStatus;
  className?: string;
}

const STATUS_VARIANT: Record<
  PurchaseOrderStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  submitted: "secondary",
  approved: "default",
  ordered: "default",
  partially_received: "secondary",
  received: "default",
  cancelled: "destructive",
};

export function PurchaseOrderStatusBadge({ status, className }: PurchaseOrderStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {PURCHASE_ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
