import type { KitchenOrderStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<KitchenOrderStatus, string> = {
  NEW: "New",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  COMPLETED: "Completed",
};

const STATUS_VARIANTS: Record<
  KitchenOrderStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  NEW: "outline",
  ACCEPTED: "default",
  PREPARING: "secondary",
  READY: "secondary",
  SERVED: "default",
  COMPLETED: "secondary",
};

interface KitchenStatusBadgeProps {
  status: KitchenOrderStatus;
}

export function KitchenStatusBadge({ status }: KitchenStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
