import type { FloorStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<FloorStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

const STATUS_VARIANTS: Record<FloorStatus, "default" | "secondary" | "outline" | "destructive"> = {
  ACTIVE: "default",
  INACTIVE: "outline",
  ARCHIVED: "destructive",
};

interface FloorStatusBadgeProps {
  status: FloorStatus;
}

export function FloorStatusBadge({ status }: FloorStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
