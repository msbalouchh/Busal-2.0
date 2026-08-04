import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReservationStatus } from "@/modules/reservations/constants/reservation-status";

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
  className?: string;
}

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked In",
  seated: "Seated",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
  waitlisted: "Waitlisted",
};

const STATUS_VARIANT: Record<
  ReservationStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  confirmed: "default",
  checked_in: "secondary",
  seated: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
  waitlisted: "outline",
};

export function ReservationStatusBadge({ status, className }: ReservationStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("font-normal", className)}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
