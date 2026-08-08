import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/modules/orders/constants/order-status";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  out_for_delivery: "Out for Delivery",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  pending: "outline",
  confirmed: "secondary",
  preparing: "default",
  ready: "default",
  served: "default",
  out_for_delivery: "secondary",
  completed: "secondary",
  cancelled: "destructive",
  refunded: "destructive",
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
