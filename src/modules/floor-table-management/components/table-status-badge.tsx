import type { RestaurantTableStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<RestaurantTableStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  DIRTY: "Dirty",
  OUT_OF_SERVICE: "Out of service",
  ARCHIVED: "Archived",
};

const STATUS_VARIANTS: Record<
  RestaurantTableStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  AVAILABLE: "default",
  OCCUPIED: "secondary",
  RESERVED: "outline",
  DIRTY: "destructive",
  OUT_OF_SERVICE: "destructive",
  ARCHIVED: "destructive",
};

interface TableStatusBadgeProps {
  status: RestaurantTableStatus;
}

export function TableStatusBadge({ status }: TableStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
