import type { ReservationStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SEATED: "Seated",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
};

const STATUS_VARIANTS: Record<
  ReservationStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDING: "outline",
  CONFIRMED: "default",
  SEATED: "secondary",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
};

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
}

export function ReservationStatusBadge({ status }: ReservationStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
