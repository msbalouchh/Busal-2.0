import type { RestaurantOrderStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<RestaurantOrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_VARIANTS: Record<
  RestaurantOrderStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDING: "outline",
  CONFIRMED: "default",
  PREPARING: "secondary",
  READY: "secondary",
  SERVED: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

interface OrderStatusBadgeProps {
  status: RestaurantOrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
