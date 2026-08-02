import type { RestaurantOrderItemStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<RestaurantOrderItemStatus, string> = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  CANCELLED: "Cancelled",
};

const STATUS_VARIANTS: Record<
  RestaurantOrderItemStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDING: "outline",
  PREPARING: "secondary",
  READY: "default",
  SERVED: "secondary",
  CANCELLED: "destructive",
};

interface OrderKitchenStatusBadgeProps {
  status: RestaurantOrderItemStatus;
}

export function OrderKitchenStatusBadge({ status }: OrderKitchenStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
